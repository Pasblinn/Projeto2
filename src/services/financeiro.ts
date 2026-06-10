import {
  findRow,
  generateId,
  insertRow,
  listRows,
  nowIso,
  updateRow,
} from '@/services/db'
import type {
  MovimentoFinanceiro,
  OrdemProducao,
  StatusFinanceiro,
  TipoMovimento,
} from '@/types'

const COLLECTION = 'movimentos_financeiros'

export interface NovoMovimento {
  ordem_producao_id: string
  tipo: TipoMovimento
  valor: number
  data: string
  descricao?: string | null
}

export function saldoDevedor(ordem: OrdemProducao): number {
  return Math.max(0, (ordem.valor_total ?? 0) - ordem.valor_pago)
}

function statusFinanceiroFor(ordem: OrdemProducao, valorPago: number): StatusFinanceiro {
  const total = ordem.valor_total ?? 0
  if (total > 0 && valorPago >= total) return 'pago'

  const vencida =
    ordem.data_entrega != null &&
    ordem.data_entrega < new Date().toISOString().slice(0, 10)
  if (vencida) return 'atrasado'

  return valorPago > 0 ? 'parcial' : 'pendente'
}

export async function listMovimentos(ordemId?: string): Promise<MovimentoFinanceiro[]> {
  const movimentos = listRows(COLLECTION).filter(
    (movimento) => !ordemId || movimento.ordem_producao_id === ordemId,
  )
  return movimentos.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function registrarMovimento(
  input: NovoMovimento,
  registradoPor: string,
): Promise<MovimentoFinanceiro> {
  const ordem = findRow('ordens_producao', input.ordem_producao_id)
  if (!ordem) {
    throw new Error('Ordem de producao nao encontrada')
  }
  if (!Number.isFinite(input.valor) || input.valor <= 0) {
    throw new Error('Valor do movimento deve ser maior que zero')
  }

  const movimento = insertRow(COLLECTION, {
    id: generateId(),
    ordem_producao_id: input.ordem_producao_id,
    tipo: input.tipo,
    valor: input.valor,
    data: input.data,
    descricao: input.descricao ?? null,
    registrado_por: registradoPor,
    created_at: nowIso(),
  })

  // Estornos devolvem valor ao cliente; demais movimentos abatem o saldo.
  const delta = input.tipo === 'estorno' ? -input.valor : input.valor
  const valorPago = Math.max(0, ordem.valor_pago + delta)

  updateRow('ordens_producao', ordem.id, {
    valor_pago: valorPago,
    status_financeiro: statusFinanceiroFor(ordem, valorPago),
    updated_at: nowIso(),
  })

  return movimento
}

export async function registrarPagamento(
  ordemId: string,
  valor: number,
  data: string,
  descricao: string | null,
  registradoPor: string,
): Promise<MovimentoFinanceiro> {
  const ordem = findRow('ordens_producao', ordemId)
  if (!ordem) {
    throw new Error('Ordem de producao nao encontrada')
  }

  const tipo: TipoMovimento =
    valor >= saldoDevedor(ordem) ? 'pagamento' : 'pagamento_parcial'

  return registrarMovimento(
    { ordem_producao_id: ordemId, tipo, valor, data, descricao },
    registradoPor,
  )
}
