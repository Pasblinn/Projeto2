import { useEffect, useState } from 'react'
import ReportSection from '@/components/reports/ReportSection'
import ReportShell from '@/components/reports/ReportShell'
import ReportTable from '@/components/reports/ReportTable'
import type { ReportProps } from '@/components/reports/types'
import { listOrdens } from '@/services/ordens'
import { listRegistros } from '@/services/producao'
import type { OrdemProducao, RegistroProducao } from '@/types'
import { formatDate, formatOpCode, TURNO_LABEL } from '@/utils/format'

interface ProducaoData {
  ordens: OrdemProducao[]
  registros: RegistroProducao[]
}

interface ResumoPorOp {
  ordem: OrdemProducao
  produzidas: number
  defeituosas: number
}

function ProducaoPeriodoReport({ params }: ReportProps) {
  const [data, setData] = useState<ProducaoData | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([listOrdens(), listRegistros()]).then(([ordens, registros]) => {
      if (active) setData({ ordens, registros })
    })
    return () => {
      active = false
    }
  }, [])

  if (!data) return null

  const registrosPeriodo = data.registros.filter(
    (registro) => registro.data >= params.inicio && registro.data <= params.fim,
  )
  const ordensById = new Map(data.ordens.map((ordem) => [ordem.id, ordem]))

  const porOp = new Map<string, ResumoPorOp>()
  for (const registro of registrosPeriodo) {
    const ordem = ordensById.get(registro.ordem_producao_id)
    if (!ordem) continue
    const atual = porOp.get(ordem.id) ?? { ordem, produzidas: 0, defeituosas: 0 }
    atual.produzidas += registro.quantidade_produzida
    atual.defeituosas += registro.pecas_defeituosas
    porOp.set(ordem.id, atual)
  }
  const resumo = [...porOp.values()].sort((a, b) => b.produzidas - a.produzidas)

  const totalProduzidas = resumo.reduce((sum, item) => sum + item.produzidas, 0)
  const totalDefeituosas = resumo.reduce((sum, item) => sum + item.defeituosas, 0)

  return (
    <ReportShell
      title="Producao por Periodo"
      subtitle={`Periodo: ${formatDate(params.inicio)} a ${formatDate(params.fim)}`}
    >
      <ReportSection title="Resumo por OP">
        <ReportTable
          rows={resumo}
          rowKey={(item) => item.ordem.id}
          emptyMessage="Nenhuma producao registrada no periodo."
          columns={[
            { header: 'OP', render: (r) => formatOpCode(r.ordem.numero) },
            { header: 'Cliente', render: (r) => r.ordem.cliente },
            { header: 'Descricao', render: (r) => r.ordem.descricao },
            { header: 'Produzidas', align: 'right', render: (r) => String(r.produzidas) },
            {
              header: 'Defeituosas',
              align: 'right',
              render: (r) => String(r.defeituosas),
            },
          ]}
        />
        <p className="print-total mt-3 border-t-2 border-gray-900 pt-2 text-right text-base font-bold">
          Total: {totalProduzidas} produzidas, {totalDefeituosas} defeituosas
        </p>
      </ReportSection>

      <ReportSection title="Registros Detalhados">
        <ReportTable
          rows={registrosPeriodo}
          rowKey={(registro) => registro.id}
          emptyMessage="Nenhum registro no periodo."
          columns={[
            { header: 'Data', render: (r) => formatDate(r.data) },
            {
              header: 'OP',
              render: (r) => {
                const ordem = ordensById.get(r.ordem_producao_id)
                return ordem ? formatOpCode(ordem.numero) : '—'
              },
            },
            { header: 'Turno', render: (r) => TURNO_LABEL[r.turno] },
            {
              header: 'Produzidas',
              align: 'right',
              render: (r) => String(r.quantidade_produzida),
            },
            {
              header: 'Defeituosas',
              align: 'right',
              render: (r) => String(r.pecas_defeituosas),
            },
            { header: 'Observacoes', render: (r) => r.observacoes ?? '—' },
          ]}
        />
      </ReportSection>
    </ReportShell>
  )
}

export default ProducaoPeriodoReport
