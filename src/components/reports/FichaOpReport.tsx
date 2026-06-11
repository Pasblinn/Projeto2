import { useEffect, useState } from 'react'
import ReportSection from '@/components/reports/ReportSection'
import ReportShell from '@/components/reports/ReportShell'
import ReportTable from '@/components/reports/ReportTable'
import type { ReportProps } from '@/components/reports/types'
import { listMovimentos, saldoDevedor } from '@/services/financeiro'
import { getOrdem } from '@/services/ordens'
import { listDefeitos, listRegistros } from '@/services/producao'
import type {
  MovimentoFinanceiro,
  OrdemProducao,
  RegistroDefeito,
  RegistroProducao,
} from '@/types'
import {
  FORMA_PAGAMENTO_LABEL,
  formatCurrency,
  formatDate,
  TIPO_MOVIMENTO_LABEL,
  TIPO_OP_LABEL,
} from '@/utils/format'

interface FichaData {
  ordem: OrdemProducao
  registros: RegistroProducao[]
  defeitos: RegistroDefeito[]
  movimentos: MovimentoFinanceiro[]
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <p className="print-info-item text-sm">
      <span className="print-info-label font-semibold">{label}: </span>
      {value}
    </p>
  )
}

function FichaOpReport({ params }: ReportProps) {
  const [data, setData] = useState<FichaData | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      getOrdem(params.ordemId),
      listRegistros(params.ordemId),
      listDefeitos(params.ordemId),
      listMovimentos(params.ordemId),
    ]).then(([ordem, registros, defeitos, movimentos]) => {
      if (active) setData({ ordem, registros, defeitos, movimentos })
    })
    return () => {
      active = false
    }
  }, [params.ordemId])

  if (!data) return null
  const { ordem, registros, defeitos, movimentos } = data

  return (
    <ReportShell
      title="Ficha de Ordem de Producao"
      subtitle={`${ordem.codigo} - ${ordem.cliente}`}
    >
      <ReportSection title="Dados Gerais">
        <div className="print-info-grid grid grid-cols-2 gap-2">
          <InfoItem label="Tipo" value={TIPO_OP_LABEL[ordem.tipo]} />
          <InfoItem label="Cliente" value={ordem.cliente} />
          <InfoItem label="CNPJ" value={ordem.cnpj_cliente} />
          <InfoItem label="Peca" value={ordem.nome_peca} />
          <InfoItem
            label="Quantidade"
            value={`${ordem.quantidade_total} ${ordem.unidade ?? 'unid.'}`}
          />
          <InfoItem label="Inicio" value={formatDate(ordem.data_inicio)} />
          <InfoItem label="Termino" value={formatDate(ordem.data_termino)} />
          <InfoItem
            label="Aprovada"
            value={
              ordem.aprovada
                ? `Sim, por ${ordem.supervisor_nome} em ${formatDate(ordem.supervisor_data_aprovacao)}`
                : 'Nao'
            }
          />
          <InfoItem label="Maquina" value={ordem.maquina_utilizada} />
          <InfoItem label="Operador" value={ordem.operador_responsavel} />
          <InfoItem
            label="Preco do servico"
            value={formatCurrency(ordem.preco_servico)}
          />
          <InfoItem
            label="Preco do material"
            value={
              ordem.preco_material != null && ordem.preco_material > 0
                ? formatCurrency(ordem.preco_material)
                : null
            }
          />
          <InfoItem label="Valor pago" value={formatCurrency(ordem.valor_pago)} />
          <InfoItem
            label="Forma de pagamento"
            value={
              ordem.forma_pagamento ? FORMA_PAGAMENTO_LABEL[ordem.forma_pagamento] : null
            }
          />
        </div>
      </ReportSection>

      <ReportSection title="Material">
        <div className="print-info-grid grid grid-cols-2 gap-2">
          <InfoItem label="Material" value={ordem.material} />
          <InfoItem label="Codigo / Descricao" value={ordem.codigo_descricao_material} />
          <InfoItem label="Quantidade" value={ordem.quantidade_material} />
          <InfoItem label="Lote" value={ordem.lote} />
          <InfoItem label="Fornecedor" value={ordem.fornecedor} />
          <InfoItem label="Observacoes" value={ordem.observacoes_material} />
        </div>
        {!ordem.material && !ordem.codigo_descricao_material && (
          <p className="text-sm text-gray-600">Sem dados de material.</p>
        )}
      </ReportSection>

      <ReportSection title="Producao Diaria">
        <ReportTable
          rows={registros}
          rowKey={(registro) => registro.id}
          emptyMessage="Nenhum registro de producao."
          columns={[
            { header: 'Data', render: (r) => formatDate(r.data) },
            { header: 'Turno', render: (r) => r.turno },
            {
              header: 'Horario',
              render: (r) =>
                r.hora_inicio && r.hora_fim
                  ? `${r.hora_inicio} - ${r.hora_fim}`
                  : (r.hora_inicio ?? r.hora_fim ?? '—'),
            },
            { header: 'Maquina', render: (r) => r.maquina_utilizada ?? '—' },
            { header: 'Operacao', render: (r) => r.descricao_operacao },
            {
              header: 'Defeitos',
              align: 'right',
              render: (r) => String(r.pecas_defeituosas),
            },
          ]}
        />
      </ReportSection>

      <ReportSection title="Pecas Defeituosas">
        <ReportTable
          rows={defeitos}
          rowKey={(defeito) => defeito.id}
          emptyMessage="Nenhum defeito registrado."
          columns={[
            { header: 'Data', render: (d) => formatDate(d.data) },
            { header: 'Tipo', render: (d) => d.tipo_defeito },
            { header: 'Qtd', align: 'right', render: (d) => String(d.quantidade) },
            { header: 'Causa provavel', render: (d) => d.causa_provavel ?? '—' },
            { header: 'Acao corretiva', render: (d) => d.acao_corretiva ?? '—' },
          ]}
        />
      </ReportSection>

      <ReportSection title="Movimentos Financeiros">
        <ReportTable
          rows={movimentos}
          rowKey={(movimento) => movimento.id}
          emptyMessage="Nenhum movimento financeiro."
          columns={[
            { header: 'Data', render: (m) => formatDate(m.data) },
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
          Saldo em aberto: {formatCurrency(saldoDevedor(ordem))}
        </p>
      </ReportSection>
    </ReportShell>
  )
}

export default FichaOpReport
