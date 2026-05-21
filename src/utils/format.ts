import type { FormaPagamento, TipoOP } from '@/types'

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

export function formatOpCode(numero: number): string {
  return `OP-${String(numero).padStart(4, '0')}`
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
