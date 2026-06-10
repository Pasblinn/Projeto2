import { ComponentType, useEffect, useMemo, useState } from 'react'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Select from '@/components/Select'
import FichaOpReport from '@/components/reports/FichaOpReport'
import PrintArea from '@/components/reports/PrintArea'
import ResumoFinanceiroReport from '@/components/reports/ResumoFinanceiroReport'
import type { ReportParams } from '@/components/reports/types'
import { useToast } from '@/contexts/ToastContext'
import { listOrdens } from '@/services/ordens'
import type { OrdemProducao } from '@/types'
import { formatOpCode } from '@/utils/format'

type ParamNeed = 'ordem' | 'cliente' | 'periodo'

interface ReportDefinition {
  key: string
  label: string
  description: string
  needs: ParamNeed[]
  component: ComponentType<{ params: ReportParams }>
}

const REPORTS: ReportDefinition[] = [
  {
    key: 'ficha-op',
    label: 'Ficha de OP',
    description:
      'Ficha completa da ordem: dados gerais, producao, defeitos e financeiro.',
    needs: ['ordem'],
    component: FichaOpReport,
  },
  {
    key: 'resumo-financeiro',
    label: 'Resumo Financeiro',
    description: 'Totais e movimentos financeiros do periodo selecionado.',
    needs: ['periodo'],
    component: ResumoFinanceiroReport,
  },
]

function firstDayOfMonth(): string {
  return `${new Date().toISOString().slice(0, 7)}-01`
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function Relatorios() {
  const toast = useToast()
  const [ordens, setOrdens] = useState<OrdemProducao[]>([])
  const [reportKey, setReportKey] = useState('')
  const [ordemId, setOrdemId] = useState('')
  const [cliente, setCliente] = useState('')
  const [inicio, setInicio] = useState(firstDayOfMonth())
  const [fim, setFim] = useState(today())

  useEffect(() => {
    listOrdens()
      .then(setOrdens)
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Falha ao carregar OPs'
        toast.error(message)
      })
  }, [toast])

  const report = REPORTS.find((item) => item.key === reportKey)

  const ordemOptions = ordens.map((ordem) => ({
    value: ordem.id,
    label: `${formatOpCode(ordem.numero)} - ${ordem.cliente}`,
  }))

  const clienteOptions = useMemo(() => {
    const nomes = [...new Set(ordens.map((ordem) => ordem.cliente))].sort()
    return nomes.map((nome) => ({ value: nome, label: nome }))
  }, [ordens])

  const params: ReportParams = { ordemId, cliente, inicio, fim }

  const paramsReady =
    report != null &&
    report.needs.every((need) => {
      if (need === 'ordem') return ordemId !== ''
      if (need === 'cliente') return cliente !== ''
      return inicio !== '' && fim !== ''
    })

  const ReportComponent = report?.component

  return (
    <div className="flex flex-col gap-6">
      <Card
        title="Relatorios"
        subtitle="Selecione o relatorio, ajuste os parametros e imprima em A4"
        actions={
          <Button
            variant="primary"
            size="sm"
            disabled={!paramsReady}
            onClick={() => window.print()}
          >
            Imprimir
          </Button>
        }
      >
        {REPORTS.length === 0 ? (
          <p className="text-sm text-gray-600">
            Os relatorios serao adicionados em breve.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Relatorio"
                placeholder="Selecione..."
                options={REPORTS.map((item) => ({
                  value: item.key,
                  label: item.label,
                }))}
                value={reportKey}
                onChange={(e) => setReportKey(e.target.value)}
              />
              {report?.needs.includes('ordem') && (
                <Select
                  label="Ordem de Producao"
                  placeholder="Selecione a OP..."
                  options={ordemOptions}
                  value={ordemId}
                  onChange={(e) => setOrdemId(e.target.value)}
                />
              )}
              {report?.needs.includes('cliente') && (
                <Select
                  label="Cliente"
                  placeholder="Selecione o cliente..."
                  options={clienteOptions}
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                />
              )}
            </div>

            {report?.needs.includes('periodo') && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Data inicial"
                  type="date"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                />
                <Input
                  label="Data final"
                  type="date"
                  value={fim}
                  onChange={(e) => setFim(e.target.value)}
                />
              </div>
            )}

            {report && (
              <p className="text-xs text-gray-500">{report.description}</p>
            )}
          </div>
        )}
      </Card>

      {ReportComponent && paramsReady && (
        <>
          <Card title="Pre-visualizacao" padding="none">
            <ReportComponent params={params} />
          </Card>
          <PrintArea>
            <ReportComponent params={params} />
          </PrintArea>
        </>
      )}
    </div>
  )
}

export default Relatorios
