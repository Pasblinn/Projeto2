import { useEffect, useState } from 'react'
import ReportSection from '@/components/reports/ReportSection'
import ReportShell from '@/components/reports/ReportShell'
import ReportTable from '@/components/reports/ReportTable'
import type { ReportProps } from '@/components/reports/types'
import { listOrdens } from '@/services/ordens'
import { listRegistros } from '@/services/producao'
import type { OrdemProducao, RegistroProducao } from '@/types'
import { formatDate } from '@/utils/format'

interface ProducaoData {
  ordens: OrdemProducao[]
  registros: RegistroProducao[]
}

interface ResumoPorOp {
  ordem: OrdemProducao
  operacoes: number
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
    const atual = porOp.get(ordem.id) ?? { ordem, operacoes: 0, defeituosas: 0 }
    atual.operacoes += 1
    atual.defeituosas += registro.pecas_defeituosas
    porOp.set(ordem.id, atual)
  }
  const resumo = [...porOp.values()].sort((a, b) => b.operacoes - a.operacoes)

  const totalOperacoes = registrosPeriodo.length
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
            { header: 'OP', render: (r) => r.ordem.codigo },
            { header: 'Cliente', render: (r) => r.ordem.cliente },
            { header: 'Peca', render: (r) => r.ordem.nome_peca },
            { header: 'Operacoes', align: 'right', render: (r) => String(r.operacoes) },
            {
              header: 'Defeituosas',
              align: 'right',
              render: (r) => String(r.defeituosas),
            },
          ]}
        />
        <p className="print-total mt-3 border-t-2 border-gray-900 pt-2 text-right text-base font-bold">
          Total: {totalOperacoes} operacoes, {totalDefeituosas} pecas defeituosas
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
              render: (r) => ordensById.get(r.ordem_producao_id)?.codigo ?? '—',
            },
            { header: 'Turno', render: (r) => r.turno },
            {
              header: 'Horario',
              render: (r) =>
                r.hora_inicio && r.hora_fim
                  ? `${r.hora_inicio} - ${r.hora_fim}`
                  : (r.hora_inicio ?? r.hora_fim ?? '—'),
            },
            { header: 'Operacao', render: (r) => r.descricao_operacao },
            {
              header: 'Defeituosas',
              align: 'right',
              render: (r) => String(r.pecas_defeituosas),
            },
          ]}
        />
      </ReportSection>
    </ReportShell>
  )
}

export default ProducaoPeriodoReport
