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
  return Math.max(0, ordem.preco_servico - ordem.valor_pago)
}

function statusFinanceiroFor(ordem: OrdemProducao, valorPago: number): StatusFinanceiro {
  if (ordem.preco_servico > 0 && valorPago >= ordem.preco_servico) return 'pago'

  const vencida =
    ordem.data_termino != null &&
    ordem.data_termino < new Date().toISOString().slice(0, 10)
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

  // Pagamentos e ajustes abatem o saldo; estornos devolvem valor ao
  // cliente; custos extras sao despesa interna e nao tocam o recebido.
  const DELTA_FACTOR: Record<TipoMovimento, number> = {
    pagamento: 1,
    pagamento_parcial: 1,
    ajuste: 1,
    estorno: -1,
    custo_extra: 0,
  }
  const delta = DELTA_FACTOR[input.tipo] * input.valor
  if (delta !== 0) {
    const valorPago = Math.max(0, ordem.valor_pago + delta)
    updateRow('ordens_producao', ordem.id, {
      valor_pago: valorPago,
      status_financeiro: statusFinanceiroFor(ordem, valorPago),
      updated_at: nowIso(),
    })
  }

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
