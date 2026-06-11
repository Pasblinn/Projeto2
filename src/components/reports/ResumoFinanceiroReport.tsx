import { useEffect, useState } from 'react'
import ReportSection from '@/components/reports/ReportSection'
import ReportShell from '@/components/reports/ReportShell'
import ReportTable from '@/components/reports/ReportTable'
import type { ReportProps } from '@/components/reports/types'
import { listMovimentos, saldoDevedor } from '@/services/financeiro'
import { listOrdens } from '@/services/ordens'
import type { MovimentoFinanceiro, OrdemProducao } from '@/types'
import {
  formatCurrency,
  formatDate,
  TIPO_MOVIMENTO_LABEL,
} from '@/utils/format'

interface ResumoData {
  ordens: OrdemProducao[]
  movimentos: MovimentoFinanceiro[]
}

function ResumoFinanceiroReport({ params }: ReportProps) {
  const [data, setData] = useState<ResumoData | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([listOrdens(), listMovimentos()]).then(([ordens, movimentos]) => {
      if (active) setData({ ordens, movimentos })
    })
    return () => {
      active = false
    }
  }, [])

  if (!data) return null

  const movimentosPeriodo = data.movimentos.filter(
    (movimento) => movimento.data >= params.inicio && movimento.data <= params.fim,
  )
  const recebido = movimentosPeriodo.reduce(
    (sum, movimento) =>
      sum + (movimento.tipo === 'estorno' ? -movimento.valor : movimento.valor),
    0,
  )
  const ativas = data.ordens.filter((ordem) => ordem.status_financeiro !== 'cancelado')
  const emAberto = ativas.reduce((sum, ordem) => sum + saldoDevedor(ordem), 0)
  const faturamento = ativas.reduce((sum, ordem) => sum + ordem.preco_servico, 0)

  const ordensById = new Map(data.ordens.map((ordem) => [ordem.id, ordem]))

  return (
    <ReportShell
      title="Resumo Financeiro"
      subtitle={`Periodo: ${formatDate(params.inicio)} a ${formatDate(params.fim)}`}
    >
      <ReportSection title="Totais">
        <div className="print-info-grid grid grid-cols-2 gap-2 text-sm">
          <p>
            <span className="print-info-label font-semibold">Recebido no periodo: </span>
            {formatCurrency(recebido)}
          </p>
          <p>
            <span className="print-info-label font-semibold">Saldo em aberto (geral): </span>
            {formatCurrency(emAberto)}
          </p>
          <p>
            <span className="print-info-label font-semibold">Faturamento total (geral): </span>
            {formatCurrency(faturamento)}
          </p>
          <p>
            <span className="print-info-label font-semibold">Movimentos no periodo: </span>
            {String(movimentosPeriodo.length)}
          </p>
        </div>
      </ReportSection>

      <ReportSection title="Movimentos do Periodo">
        <ReportTable
          rows={movimentosPeriodo}
          rowKey={(movimento) => movimento.id}
          columns={[
            { header: 'Data', render: (m) => formatDate(m.data) },
            {
              header: 'OP',
              render: (m) => {
                const ordem = ordensById.get(m.ordem_producao_id)
                return ordem ? ordem.codigo : '—'
              },
            },
            {
              header: 'Cliente',
              render: (m) => ordensById.get(m.ordem_producao_id)?.cliente ?? '—',
            },
            { header: 'Tipo', render: (m) => TIPO_MOVIMENTO_LABEL[m.tipo] },
            {
              header: 'Valor',
              align: 'right',
              render: (m) =>
                `${m.tipo === 'estorno' ? '-' : ''}${formatCurrency(m.valor)}`,
            },
            { header: 'Descricao', render: (m) => m.descricao ?? '—' },
          ]}
        />
        <p className="print-total mt-3 border-t-2 border-gray-900 pt-2 text-right text-base font-bold">
          Total recebido no periodo: {formatCurrency(recebido)}
        </p>
      </ReportSection>
    </ReportShell>
  )
}

export default ResumoFinanceiroReport
