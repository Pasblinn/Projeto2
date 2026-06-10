import { useEffect, useState } from 'react'
import ReportSection from '@/components/reports/ReportSection'
import ReportShell from '@/components/reports/ReportShell'
import ReportTable from '@/components/reports/ReportTable'
import type { ReportProps } from '@/components/reports/types'
import { listOrdens } from '@/services/ordens'
import type { OrdemProducao, StatusProducao } from '@/types'
import { formatCurrency, formatDate, formatOpCode } from '@/utils/format'

const STATUS_ORDER: StatusProducao[] = [
  'criada',
  'em_producao',
  'pausada',
  'finalizada',
  'cancelada',
]

const STATUS_LABEL: Record<StatusProducao, string> = {
  criada: 'Criada',
  em_producao: 'Em producao',
  pausada: 'Pausada',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
}

function OpsPorStatusReport(_props: ReportProps) {
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

  const grupos = STATUS_ORDER.map((status) => ({
    status,
    ordens: ordens.filter((ordem) => ordem.status_producao === status),
  }))

  return (
    <ReportShell title="OPs por Status" subtitle={`${ordens.length} OP(s) no total`}>
      <ReportSection title="Resumo">
        <ReportTable
          rows={grupos}
          rowKey={(grupo) => grupo.status}
          columns={[
            { header: 'Status', render: (g) => STATUS_LABEL[g.status] },
            {
              header: 'Quantidade de OPs',
              align: 'right',
              render: (g) => String(g.ordens.length),
            },
            {
              header: 'Valor total',
              align: 'right',
              render: (g) =>
                formatCurrency(
                  g.ordens.reduce((sum, ordem) => sum + (ordem.valor_total ?? 0), 0),
                ),
            },
          ]}
        />
      </ReportSection>

      {grupos
        .filter((grupo) => grupo.ordens.length > 0)
        .map((grupo) => (
          <ReportSection
            key={grupo.status}
            title={`${STATUS_LABEL[grupo.status]} (${grupo.ordens.length})`}
          >
            <ReportTable
              rows={grupo.ordens}
              rowKey={(ordem) => ordem.id}
              columns={[
                { header: 'OP', render: (o) => formatOpCode(o.numero) },
                { header: 'Cliente', render: (o) => o.cliente },
                { header: 'Entrega', render: (o) => formatDate(o.data_entrega) },
                {
                  header: 'Progresso',
                  align: 'right',
                  render: (o) => `${o.quantidade_produzida}/${o.quantidade}`,
                },
                {
                  header: 'Valor total',
                  align: 'right',
                  render: (o) => formatCurrency(o.valor_total),
                },
              ]}
            />
          </ReportSection>
        ))}
    </ReportShell>
  )
}

export default OpsPorStatusReport
