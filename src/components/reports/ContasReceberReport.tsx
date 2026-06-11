import { useEffect, useState } from 'react'
import ReportSection from '@/components/reports/ReportSection'
import ReportShell from '@/components/reports/ReportShell'
import ReportTable from '@/components/reports/ReportTable'
import type { ReportProps } from '@/components/reports/types'
import { saldoDevedor } from '@/services/financeiro'
import { listOrdens } from '@/services/ordens'
import type { OrdemProducao } from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'

const STATUS_LABEL: Record<OrdemProducao['status_financeiro'], string> = {
  pendente: 'Pendente',
  parcial: 'Parcial',
  pago: 'Pago',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
}

function ContasReceberReport(_props: ReportProps) {
  const [ordens, setOrdens] = useState<OrdemProducao[] | null>(null)

  useEffect(() => {
    let active = true
    listOrdens().then((lista) => {
      if (active) setOrdens(lista)
    })
    return () => {
      active = false
    }
  }, [])

  if (!ordens) return null

  const contas = ordens.filter(
    (ordem) =>
      ordem.status_financeiro !== 'cancelado' &&
      (ordem.preco_servico ?? 0) > 0 &&
      saldoDevedor(ordem) > 0,
  )
  const totalAberto = contas.reduce((sum, ordem) => sum + saldoDevedor(ordem), 0)

  return (
    <ReportShell
      title="Contas a Receber"
      subtitle={`${contas.length} OP(s) com saldo em aberto`}
    >
      <ReportSection title="OPs com Saldo em Aberto">
        <ReportTable
          rows={contas}
          rowKey={(ordem) => ordem.id}
          emptyMessage="Nenhuma conta a receber."
          columns={[
            { header: 'OP', render: (o) => o.codigo },
            { header: 'Cliente', render: (o) => o.cliente },
            { header: 'Entrega', render: (o) => formatDate(o.data_termino) },
            { header: 'Status', render: (o) => STATUS_LABEL[o.status_financeiro] },
            {
              header: 'Valor total',
              align: 'right',
              render: (o) => formatCurrency(o.preco_servico),
            },
            {
              header: 'Pago',
              align: 'right',
              render: (o) => formatCurrency(o.valor_pago),
            },
            {
              header: 'Saldo',
              align: 'right',
              render: (o) => formatCurrency(saldoDevedor(o)),
            },
          ]}
        />
        <p className="print-total mt-3 border-t-2 border-gray-900 pt-2 text-right text-base font-bold">
          Total a receber: {formatCurrency(totalAberto)}
        </p>
      </ReportSection>
    </ReportShell>
  )
}

export default ContasReceberReport
