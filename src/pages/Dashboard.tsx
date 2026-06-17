import { ComponentType, ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  ClipboardList,
  Coins,
  Percent,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import { useToast } from '@/contexts/ToastContext'
import { getDashboardMetrics, type DashboardMetrics } from '@/services/metrics'
import type { StatusProducao } from '@/types'
import {
  formatCurrency,
  formatDayMonth,
  formatMonth,
  formatPercent,
} from '@/utils/format'

const STATUS_COLOR: Record<StatusProducao, string> = {
  criada: '#2563eb',
  em_producao: '#ca8a04',
  pausada: '#ea580c',
  finalizada: '#16a34a',
  cancelada: '#9ca3af',
}

type IconComponent = ComponentType<{ size?: number | string; className?: string }>

interface KpiCardProps {
  label: string
  value: string
  hint?: string
  icon: IconComponent
  tone?: 'default' | 'positive' | 'negative'
}

function KpiCard({ label, value, hint, icon: Icon, tone = 'default' }: KpiCardProps) {
  const ring = {
    default: 'bg-primary-50 text-primary-600',
    positive: 'bg-green-50 text-green-600',
    negative: 'bg-red-50 text-red-600',
  }[tone]
  const valueColor = {
    default: 'text-gray-900',
    positive: 'text-green-700',
    negative: 'text-red-700',
  }[tone]

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ring}`}>
          <Icon size={22} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className={`truncate text-xl font-bold ${valueColor}`}>{value}</p>
          {hint && <p className="truncate text-xs text-gray-400">{hint}</p>}
        </div>
      </div>
    </Card>
  )
}

function ChartCard({ title, subtitle, children }: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <Card title={title} subtitle={subtitle}>
      <div className="h-72 w-full">{children}</div>
    </Card>
  )
}

const AXIS = { fontSize: 12, fill: '#6b7280' }

function Dashboard() {
  const toast = useToast()
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getDashboardMetrics()
      .then((m) => {
        if (active) setMetrics(m)
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Falha ao carregar indicadores')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [toast])

  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">Carregando indicadores...</p>
  }

  if (!metrics || metrics.kpis.opsTotal === 0) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardList}
          title="Sem dados para exibir ainda"
          description="Cadastre ordens de producao para ver os indicadores e graficos de gestao."
        />
      </Card>
    )
  }

  const { kpis, opsPorStatus, faturamentoPorMes, producaoPorDia, topClientes } = metrics

  const mesData = faturamentoPorMes.map((p) => ({ ...p, label: formatMonth(p.mes) }))
  const prodData = producaoPorDia.map((p) => ({ ...p, label: formatDayMonth(p.data) }))

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Faturamento total"
          value={formatCurrency(kpis.faturamentoTotal)}
          icon={Wallet}
        />
        <KpiCard
          label="Recebido"
          value={formatCurrency(kpis.recebido)}
          hint={`${formatCurrency(kpis.aReceber)} a receber`}
          icon={Coins}
          tone="positive"
        />
        <KpiCard
          label="Margem estimada"
          value={formatPercent(kpis.margemEstimadaPct)}
          hint={`Custo material ${formatCurrency(kpis.custoMaterial)}`}
          icon={TrendingUp}
        />
        <KpiCard
          label="Taxa de refugo"
          value={formatPercent(kpis.taxaRefugoPct)}
          hint="pecas defeituosas / produzidas"
          icon={Percent}
          tone={kpis.taxaRefugoPct > 5 ? 'negative' : 'default'}
        />
        <KpiCard
          label="OPs ativas"
          value={String(kpis.opsAtivas)}
          hint={`${kpis.opsTotal} no total`}
          icon={ClipboardList}
        />
        <KpiCard
          label="OPs atrasadas"
          value={String(kpis.opsAtrasadas)}
          hint="termino vencido"
          icon={AlertTriangle}
          tone={kpis.opsAtrasadas > 0 ? 'negative' : 'positive'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Faturamento e recebimento" subtitle="Por mes de inicio / pagamento">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mesData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis
                tick={AXIS}
                axisLine={false}
                tickLine={false}
                width={70}
                tickFormatter={(v) => `R$${(Number(v) / 1000).toLocaleString('pt-BR')}k`}
              />
              <Tooltip
                formatter={(v) => formatCurrency(Number(v))}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="faturamento" name="Faturamento" fill="#0284c7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recebido" name="Recebido" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="OPs por status" subtitle="Distribuicao da producao">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={opsPorStatus}
                dataKey="count"
                nameKey="label"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
              >
                {opsPorStatus.map((slice) => (
                  <Cell key={slice.status} fill={STATUS_COLOR[slice.status]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n) => [`${Number(v)} OP(s)`, n]}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Producao diaria" subtitle="Operacoes e pecas defeituosas">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={prodData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="operacoes" name="Operacoes" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="defeituosas" name="Defeituosas" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top clientes" subtitle="Por faturamento contratado">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topClientes}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
              <XAxis
                type="number"
                tick={AXIS}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${(Number(v) / 1000).toLocaleString('pt-BR')}k`}
              />
              <YAxis
                type="category"
                dataKey="cliente"
                tick={AXIS}
                axisLine={false}
                tickLine={false}
                width={140}
              />
              <Tooltip
                formatter={(v) => formatCurrency(Number(v))}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
              />
              <Bar dataKey="faturamento" name="Faturamento" fill="#0284c7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card padding="sm">
        <button
          type="button"
          onClick={() => navigate('/ordens')}
          className="w-full rounded-md px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
        >
          Ver todas as ordens de producao →
        </button>
      </Card>
    </div>
  )
}

export default Dashboard
