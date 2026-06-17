import { query } from '@/services/db'
import type { StatusProducao } from '@/types'

/**
 * Aggregated dashboard metrics computed in the database with SQL
 * (GROUP BY / SUM / GREATEST), keeping the heavy lifting in Postgres.
 */

export interface DashboardKpis {
  faturamentoTotal: number
  recebido: number
  aReceber: number
  custoMaterial: number
  margemEstimadaPct: number
  taxaRefugoPct: number
  opsTotal: number
  opsAtivas: number
  opsAtrasadas: number
}

export interface StatusSlice {
  status: StatusProducao
  label: string
  count: number
}

export interface MesPonto {
  mes: string
  faturamento: number
  recebido: number
}

export interface ProducaoPonto {
  data: string
  operacoes: number
  defeituosas: number
}

export interface ClientePonto {
  cliente: string
  faturamento: number
}

export interface DashboardMetrics {
  kpis: DashboardKpis
  opsPorStatus: StatusSlice[]
  faturamentoPorMes: MesPonto[]
  producaoPorDia: ProducaoPonto[]
  topClientes: ClientePonto[]
}

const STATUS_LABEL: Record<StatusProducao, string> = {
  criada: 'Criada',
  em_producao: 'Em producao',
  pausada: 'Pausada',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const today = hoje()

  const [totais, refugo, qtd, statusRows, mesOps, mesPag, prod, clientes, atrasadas] =
    await Promise.all([
      query<{ faturamento: number; recebido: number; custo_material: number; a_receber: number }>(
        `SELECT COALESCE(SUM(preco_servico), 0)                       AS faturamento,
                COALESCE(SUM(valor_pago), 0)                          AS recebido,
                COALESCE(SUM(preco_material), 0)                      AS custo_material,
                COALESCE(SUM(GREATEST(preco_servico - valor_pago, 0)), 0) AS a_receber
           FROM ordens_producao
          WHERE status_financeiro <> 'cancelado'`,
      ),
      query<{ def_prod: number; def_reg: number }>(
        `SELECT (SELECT COALESCE(SUM(pecas_defeituosas), 0) FROM registros_producao) AS def_prod,
                (SELECT COALESCE(SUM(quantidade), 0) FROM registros_defeito)         AS def_reg`,
      ),
      query<{ qtd_total: number }>(
        `SELECT COALESCE(SUM(quantidade_total), 0) AS qtd_total
           FROM ordens_producao WHERE status_producao <> 'cancelada'`,
      ),
      query<{ status: StatusProducao; count: number }>(
        `SELECT status_producao AS status, COUNT(*)::int AS count
           FROM ordens_producao GROUP BY status_producao`,
      ),
      query<{ mes: string; faturamento: number }>(
        `SELECT to_char(data_inicio::date, 'YYYY-MM') AS mes,
                COALESCE(SUM(preco_servico), 0)       AS faturamento
           FROM ordens_producao
          WHERE status_financeiro <> 'cancelado'
          GROUP BY mes ORDER BY mes`,
      ),
      query<{ mes: string; recebido: number }>(
        `SELECT to_char(data::date, 'YYYY-MM') AS mes,
                COALESCE(SUM(CASE WHEN tipo = 'estorno' THEN -valor ELSE valor END), 0) AS recebido
           FROM movimentos_financeiros
          WHERE tipo IN ('pagamento', 'pagamento_parcial', 'estorno')
          GROUP BY mes ORDER BY mes`,
      ),
      query<{ data: string; operacoes: number; defeituosas: number }>(
        `SELECT data,
                COUNT(*)::int                      AS operacoes,
                COALESCE(SUM(pecas_defeituosas), 0) AS defeituosas
           FROM registros_producao
          GROUP BY data ORDER BY data`,
      ),
      query<{ cliente: string; faturamento: number }>(
        `SELECT cliente, COALESCE(SUM(preco_servico), 0) AS faturamento
           FROM ordens_producao
          WHERE status_financeiro <> 'cancelado'
          GROUP BY cliente ORDER BY faturamento DESC LIMIT 5`,
      ),
      query<{ ativas: number; atrasadas: number }>(
        `SELECT COUNT(*) FILTER (WHERE status_producao IN ('criada','em_producao','pausada'))::int AS ativas,
                COUNT(*) FILTER (
                  WHERE status_producao IN ('criada','em_producao','pausada')
                    AND data_termino IS NOT NULL AND data_termino < $1
                )::int AS atrasadas
           FROM ordens_producao`,
        [today],
      ),
    ])

  const t = totais[0]
  const margemEstimadaPct =
    t.faturamento > 0 ? ((t.faturamento - t.custo_material) / t.faturamento) * 100 : 0
  const totalDefeitos = refugo[0].def_prod + refugo[0].def_reg
  const qtdTotal = qtd[0].qtd_total
  const taxaRefugoPct = qtdTotal > 0 ? (totalDefeitos / qtdTotal) * 100 : 0

  const opsTotal = statusRows.reduce((sum, r) => sum + r.count, 0)

  // Merge faturamento (por mes de inicio da OP) com recebido (por mes do pagamento).
  const meses = new Map<string, MesPonto>()
  for (const r of mesOps) {
    meses.set(r.mes, { mes: r.mes, faturamento: r.faturamento, recebido: 0 })
  }
  for (const r of mesPag) {
    const atual = meses.get(r.mes) ?? { mes: r.mes, faturamento: 0, recebido: 0 }
    atual.recebido = r.recebido
    meses.set(r.mes, atual)
  }
  const faturamentoPorMes = [...meses.values()].sort((a, b) => a.mes.localeCompare(b.mes))

  return {
    kpis: {
      faturamentoTotal: t.faturamento,
      recebido: t.recebido,
      aReceber: t.a_receber,
      custoMaterial: t.custo_material,
      margemEstimadaPct,
      taxaRefugoPct,
      opsTotal,
      opsAtivas: atrasadas[0].ativas,
      opsAtrasadas: atrasadas[0].atrasadas,
    },
    opsPorStatus: statusRows
      .map((r) => ({ status: r.status, label: STATUS_LABEL[r.status], count: r.count }))
      .sort((a, b) => b.count - a.count),
    faturamentoPorMes,
    producaoPorDia: prod,
    topClientes: clientes,
  }
}
