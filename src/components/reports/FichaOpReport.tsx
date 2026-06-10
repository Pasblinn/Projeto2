import { useEffect, useState } from 'react'
import ReportShell from '@/components/reports/ReportShell'
import type { ReportProps } from '@/components/reports/types'
import { listMovimentos } from '@/services/financeiro'
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
  formatOpCode,
  TIPO_MOVIMENTO_LABEL,
  TIPO_OP_LABEL,
  TURNO_LABEL,
} from '@/utils/format'

interface FichaData {
  ordem: OrdemProducao
  registros: RegistroProducao[]
  defeitos: RegistroDefeito[]
  movimentos: MovimentoFinanceiro[]
}

function InfoItem({ label, value }: { label: string; value: string }) {
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
      subtitle={`${formatOpCode(ordem.numero)} - ${ordem.cliente}`}
    >
      <section className="print-section mb-6">
        <h2 className="print-section-title mb-2 border-b border-gray-400 pb-1 text-base font-bold">
          Dados Gerais
        </h2>
        <div className="print-info-grid grid grid-cols-2 gap-2">
          <InfoItem label="Tipo" value={TIPO_OP_LABEL[ordem.tipo]} />
          <InfoItem label="Cliente" value={ordem.cliente} />
          <InfoItem label="Quantidade" value={String(ordem.quantidade)} />
          <InfoItem label="Produzida" value={String(ordem.quantidade_produzida)} />
          <InfoItem label="Entrega" value={formatDate(ordem.data_entrega)} />
          <InfoItem label="Aprovada" value={ordem.aprovada ? 'Sim' : 'Nao'} />
          <InfoItem label="Valor total" value={formatCurrency(ordem.valor_total)} />
          <InfoItem label="Valor pago" value={formatCurrency(ordem.valor_pago)} />
          <InfoItem
            label="Forma de pagamento"
            value={
              ordem.forma_pagamento ? FORMA_PAGAMENTO_LABEL[ordem.forma_pagamento] : '—'
            }
          />
          <InfoItem label="Criada em" value={formatDate(ordem.created_at)} />
        </div>
        <p className="mt-2 text-sm">
          <span className="print-info-label font-semibold">Descricao: </span>
          {ordem.descricao}
        </p>
        {ordem.observacoes && (
          <p className="mt-1 text-sm">
            <span className="print-info-label font-semibold">Observacoes: </span>
            {ordem.observacoes}
          </p>
        )}
      </section>

      <section className="print-section mb-6">
        <h2 className="print-section-title mb-2 border-b border-gray-400 pb-1 text-base font-bold">
          Registros de Producao
        </h2>
        {registros.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhum registro de producao.</p>
        ) : (
          <table className="print-table w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-gray-400 px-2 py-1 text-left">Data</th>
                <th className="border border-gray-400 px-2 py-1 text-left">Turno</th>
                <th className="border border-gray-400 px-2 py-1 text-right">Produzidas</th>
                <th className="border border-gray-400 px-2 py-1 text-right">Defeituosas</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro) => (
                <tr key={registro.id}>
                  <td className="border border-gray-300 px-2 py-1">
                    {formatDate(registro.data)}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {TURNO_LABEL[registro.turno]}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-right">
                    {registro.quantidade_produzida}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-right">
                    {registro.pecas_defeituosas}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="print-section mb-6">
        <h2 className="print-section-title mb-2 border-b border-gray-400 pb-1 text-base font-bold">
          Defeitos
        </h2>
        {defeitos.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhum defeito registrado.</p>
        ) : (
          <table className="print-table w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-gray-400 px-2 py-1 text-left">Data</th>
                <th className="border border-gray-400 px-2 py-1 text-left">Tipo</th>
                <th className="border border-gray-400 px-2 py-1 text-right">Qtd</th>
                <th className="border border-gray-400 px-2 py-1 text-left">Causa</th>
                <th className="border border-gray-400 px-2 py-1 text-left">Acao</th>
              </tr>
            </thead>
            <tbody>
              {defeitos.map((defeito) => (
                <tr key={defeito.id}>
                  <td className="border border-gray-300 px-2 py-1">
                    {formatDate(defeito.data)}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {defeito.tipo_defeito}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-right">
                    {defeito.quantidade}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {defeito.causa_provavel ?? '—'}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {defeito.acao_corretiva ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="print-section">
        <h2 className="print-section-title mb-2 border-b border-gray-400 pb-1 text-base font-bold">
          Movimentos Financeiros
        </h2>
        {movimentos.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhum movimento financeiro.</p>
        ) : (
          <table className="print-table w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-gray-400 px-2 py-1 text-left">Data</th>
                <th className="border border-gray-400 px-2 py-1 text-left">Tipo</th>
                <th className="border border-gray-400 px-2 py-1 text-right">Valor</th>
                <th className="border border-gray-400 px-2 py-1 text-left">Descricao</th>
              </tr>
            </thead>
            <tbody>
              {movimentos.map((movimento) => (
                <tr key={movimento.id}>
                  <td className="border border-gray-300 px-2 py-1">
                    {formatDate(movimento.data)}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {TIPO_MOVIMENTO_LABEL[movimento.tipo]}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-right">
                    {formatCurrency(movimento.valor)}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {movimento.descricao ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="print-total mt-3 border-t-2 border-gray-900 pt-2 text-right text-base font-bold">
          Saldo em aberto:{' '}
          {formatCurrency(Math.max(0, (ordem.valor_total ?? 0) - ordem.valor_pago))}
        </p>
      </section>
    </ReportShell>
  )
}

export default FichaOpReport
