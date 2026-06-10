import { useEffect, useMemo, useState } from 'react'
import Card from '@/components/Card'
import StatusBadge from '@/components/StatusBadge'
import { useToast } from '@/contexts/ToastContext'
import { saldoDevedor } from '@/services/financeiro'
import { listOrdens } from '@/services/ordens'
import type { OrdemProducao } from '@/types'
import { formatCurrency, formatOpCode } from '@/utils/format'

interface StatCardProps {
  label: string
  value: string
  tone?: 'default' | 'positive' | 'negative'
}

function StatCard({ label, value, tone = 'default' }: StatCardProps) {
  const valueClass =
    tone === 'positive'
      ? 'text-green-700'
      : tone === 'negative'
        ? 'text-red-700'
        : 'text-gray-900'

  return (
    <Card padding="sm">
      <p className="px-2 pt-1 text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`px-2 pb-1 text-2xl font-semibold ${valueClass}`}>{value}</p>
    </Card>
  )
}

function DashboardTab() {
  const toast = useToast()
  const [ordens, setOrdens] = useState<OrdemProducao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    listOrdens()
      .then((lista) => {
        if (active) setOrdens(lista)
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Falha ao carregar OPs'
        toast.error(message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [toast])

  const ativas = useMemo(
    () => ordens.filter((ordem) => ordem.status_financeiro !== 'cancelado'),
    [ordens],
  )

  const totais = useMemo(() => {
    const faturamento = ativas.reduce((sum, o) => sum + (o.valor_total ?? 0), 0)
    const recebido = ativas.reduce((sum, o) => sum + o.valor_pago, 0)
    const aReceber = ativas.reduce((sum, o) => sum + saldoDevedor(o), 0)
    const comSaldo = ativas.filter((o) => saldoDevedor(o) > 0).length
    return { faturamento, recebido, aReceber, comSaldo }
  }, [ativas])

  const maioresSaldos = useMemo(
    () =>
      [...ativas]
        .filter((o) => saldoDevedor(o) > 0)
        .sort((a, b) => saldoDevedor(b) - saldoDevedor(a))
        .slice(0, 5),
    [ativas],
  )

  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">Carregando...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Faturamento total" value={formatCurrency(totais.faturamento)} />
        <StatCard
          label="Recebido"
          value={formatCurrency(totais.recebido)}
          tone="positive"
        />
        <StatCard
          label="A receber"
          value={formatCurrency(totais.aReceber)}
          tone="negative"
        />
        <StatCard label="OPs com saldo" value={String(totais.comSaldo)} />
      </div>

      <Card title="Maiores saldos em aberto" padding="none">
        {maioresSaldos.length === 0 ? (
          <p className="p-6 text-sm text-gray-600">Nenhuma OP com saldo em aberto.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">OP</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Valor total</th>
                  <th className="px-4 py-3 text-right">Pago</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {maioresSaldos.map((ordem) => (
                  <tr key={ordem.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatOpCode(ordem.numero)}
                    </td>
                    <td className="px-4 py-3">{ordem.cliente}</td>
                    <td className="px-4 py-3">
                      <StatusBadge kind="financeiro" status={ordem.status_financeiro} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(ordem.valor_total)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(ordem.valor_pago)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-700">
                      {formatCurrency(saldoDevedor(ordem))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default DashboardTab
