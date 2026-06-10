import { useEffect, useState } from 'react'
import ReportSection from '@/components/reports/ReportSection'
import ReportShell from '@/components/reports/ReportShell'
import ReportTable from '@/components/reports/ReportTable'
import type { ReportProps } from '@/components/reports/types'
import { listMovimentos, saldoDevedor } from '@/services/financeiro'
import { listOrdens } from '@/services/ordens'
import type { MovimentoFinanceiro, OrdemProducao, StatusProducao } from '@/types'
import {
  formatCurrency,
  formatDate,
  formatOpCode,
  TIPO_MOVIMENTO_LABEL,
} from '@/utils/format'

const STATUS_PRODUCAO_LABEL: Record<StatusProducao, string> = {
  criada: 'Criada',
  em_producao: 'Em producao',
  pausada: 'Pausada',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
}

interface HistoricoData {
  ordens: OrdemProducao[]
  movimentos: MovimentoFinanceiro[]
}

function HistoricoClienteReport({ params }: ReportProps) {
  const [data, setData] = useState<HistoricoData | null>(null)

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

  const ordensCliente = data.ordens.filter((ordem) => ordem.cliente === params.cliente)
  const idsCliente = new Set(ordensCliente.map((ordem) => ordem.id))
  const movimentosCliente = data.movimentos.filter((movimento) =>
    idsCliente.has(movimento.ordem_producao_id),
  )
  const ordensById = new Map(ordensCliente.map((ordem) => [ordem.id, ordem]))

  const totalContratado = ordensCliente.reduce(
    (sum, ordem) => sum + (ordem.valor_total ?? 0),
    0,
  )
  const totalPago = ordensCliente.reduce((sum, ordem) => sum + ordem.valor_pago, 0)
  const totalAberto = ordensCliente.reduce((sum, ordem) => sum + saldoDevedor(ordem), 0)

  return (
    <ReportShell title="Historico do Cliente" subtitle={params.cliente}>
      <ReportSection title="Resumo">
        <div className="print-info-grid grid grid-cols-2 gap-2 text-sm">
          <p>
            <span className="print-info-label font-semibold">Total de OPs: </span>
            {String(ordensCliente.length)}
          </p>
          <p>
            <span className="print-info-label font-semibold">Total contratado: </span>
            {formatCurrency(totalContratado)}
          </p>
          <p>
            <span className="print-info-label font-semibold">Total pago: </span>
            {formatCurrency(totalPago)}
          </p>
          <p>
            <span className="print-info-label font-semibold">Saldo em aberto: </span>
            {formatCurrency(totalAberto)}
          </p>
        </div>
      </ReportSection>

      <ReportSection title="Ordens de Producao">
        <ReportTable
          rows={ordensCliente}
          rowKey={(ordem) => ordem.id}
          emptyMessage="Nenhuma OP para este cliente."
          columns={[
            { header: 'OP', render: (o) => formatOpCode(o.numero) },
            { header: 'Descricao', render: (o) => o.descricao },
            { header: 'Status', render: (o) => STATUS_PRODUCAO_LABEL[o.status_producao] },
            { header: 'Criada em', render: (o) => formatDate(o.created_at) },
            {
              header: 'Valor total',
              align: 'right',
              render: (o) => formatCurrency(o.valor_total),
            },
            {
              header: 'Pago',
              align: 'right',
              render: (o) => formatCurrency(o.valor_pago),
            },
          ]}
        />
      </ReportSection>

      <ReportSection title="Pagamentos e Movimentos">
        <ReportTable
          rows={movimentosCliente}
          rowKey={(movimento) => movimento.id}
          emptyMessage="Nenhum movimento financeiro para este cliente."
          columns={[
            { header: 'Data', render: (m) => formatDate(m.data) },
            {
              header: 'OP',
              render: (m) => {
                const ordem = ordensById.get(m.ordem_producao_id)
                return ordem ? formatOpCode(ordem.numero) : '—'
              },
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
      </ReportSection>
    </ReportShell>
  )
}

export default HistoricoClienteReport
