import type { FormaPagamento, TipoMovimento, TipoOP } from '@/types'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function formatCurrency(value?: number | null): string {
  if (value == null) return '—'
  return currencyFormatter.format(value)
}

export function formatDate(value?: string | null): string {
  if (!value) return '—'
  const parsed = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return dateFormatter.format(parsed)
}

const MESES_ABREV = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
]

// 'YYYY-MM' -> 'mai/26'
export function formatMonth(value: string): string {
  const [ano, mes] = value.split('-')
  const idx = Number(mes) - 1
  if (idx < 0 || idx > 11) return value
  return `${MESES_ABREV[idx]}/${ano.slice(2)}`
}

// '2026-06-17' -> '17/06'
export function formatDayMonth(value: string): string {
  const [, mes, dia] = value.split('-')
  if (!mes || !dia) return value
  return `${dia}/${mes}`
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

export const TIPO_OP_LABEL: Record<TipoOP, string> = {
  encomenda: 'Encomenda',
  estoque: 'Estoque',
}

export const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  transferencia: 'Transferencia',
  dinheiro: 'Dinheiro',
  cartao: 'Cartao',
}

export const TIPO_MOVIMENTO_LABEL: Record<TipoMovimento, string> = {
  pagamento: 'Pagamento',
  pagamento_parcial: 'Pagamento parcial',
  estorno: 'Estorno',
  ajuste: 'Ajuste',
  custo_extra: 'Custo extra',
}
