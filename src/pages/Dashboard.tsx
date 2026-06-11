import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import Card from '@/components/Card'
import StatusBadge from '@/components/StatusBadge'
import { useToast } from '@/contexts/ToastContext'
import { saldoDevedor } from '@/services/financeiro'
import { listOrdens } from '@/services/ordens'
import type { OrdemProducao } from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'

interface StatCardProps {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'positive' | 'negative'
}

function StatCard({ label, value, hint, tone = 'default' }: StatCardProps) {
  const valueClass =
    tone === 'positive'
      ? 'text-green-700'
      : tone === 'negative'
        ? 'text-red-700'
        : 'text-gray-900'

  return (
    <Card padding="sm">
      <div className="px-2 py-1">
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <p className={`text-2xl font-semibold ${valueClass}`}>{value}</p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    </Card>
  )
}

function Dashboard() {
  const toast = useToast()
  const navigate = useNavigate()
  const [ordens, setOrdens] = useState<OrdemProducao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    listOrdens()
      .then((lista) => {
        if (active) setOrdens(lista)
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Falha ao carregar OPs')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [toast])

  const hoje = new Date().toISOString().slice(0, 10)

  const stats = useMemo(() => {
    const emProducao = ordens.filter((o) => o.status_producao === 'em_producao')
    const ativas = ordens.filter(
      (o) => o.status_producao !== 'finalizada' && o.status_producao !== 'cancelada',
    )
    const atrasadas = ativas.filter(
      (o) => o.data_termino != null && o.data_termino < hoje,
    )
    const aReceber = ordens
      .filter((o) => o.status_financeiro !== 'cancelado')
      .reduce((sum, o) => sum + saldoDevedor(o), 0)
    return { total: ordens.length, emProducao, ativas, atrasadas, aReceber }
  }, [ordens, hoje])

  const emAndamento = useMemo(
    () =>
      ordens.filter(
        (o) => o.status_producao === 'em_producao' || o.status_producao === 'pausada',
      ),
    [ordens],
  )

  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">Carregando...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total de OPs" value={String(stats.total)} />
        <StatCard
          label="Em producao"
          value={String(stats.emProducao.length)}
          hint={`${stats.ativas.length} ativas no total`}
        />
        <StatCard
          label="Atrasadas"
          value={String(stats.atrasadas.length)}
          tone={stats.atrasadas.length > 0 ? 'negative' : 'default'}
          hint="termino vencido"
        />
        <StatCard
          label="A receber"
          value={formatCurrency(stats.aReceber)}
          tone="negative"
        />
      </div>

      <Card
        title="OPs em Andamento"
        subtitle="Em producao ou pausadas"
        actions={
          <Button variant="secondary" size="sm" onClick={() => navigate('/ordens')}>
            Ver todas as ordens
          </Button>
        }
        padding="none"
      >
        {emAndamento.length === 0 ? (
          <p className="p-6 text-sm text-gray-600">
            Nenhuma OP em andamento. Abra a tela de Ordens de Producao para
            criar ou iniciar uma OP.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">OP</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Peca</th>
                  <th className="px-4 py-3">Termino</th>
                  <th className="px-4 py-3">Producao</th>
                  <th className="px-4 py-3">Financeiro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {emAndamento.map((ordem) => (
                  <tr
                    key={ordem.id}
                    onClick={() => navigate(`/ordens/${ordem.id}`)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {ordem.codigo}
                    </td>
                    <td className="px-4 py-3">{ordem.cliente}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-gray-700">
                      {ordem.nome_peca}
                    </td>
                    <td className="px-4 py-3">{formatDate(ordem.data_termino)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge kind="producao" status={ordem.status_producao} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge kind="financeiro" status={ordem.status_financeiro} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Ultimas OPs" padding="none">
        {ordens.length === 0 ? (
          <p className="p-6 text-sm text-gray-600">Nenhuma OP cadastrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">OP</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Peca</th>
                  <th className="px-4 py-3">Producao</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ordens.slice(0, 5).map((ordem) => (
                  <tr
                    key={ordem.id}
                    onClick={() => navigate(`/ordens/${ordem.id}`)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {ordem.codigo}
                    </td>
                    <td className="px-4 py-3">{ordem.cliente}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-gray-700">
                      {ordem.nome_peca}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge kind="producao" status={ordem.status_producao} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(ordem.preco_servico)}
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

export default Dashboard
