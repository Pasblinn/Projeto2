import {
  deleteRow,
  findRow,
  generateId,
  insertRow,
  listRows,
  nextCounter,
  nowIso,
  updateRow,
} from '@/services/db'
import type { NovoOrcamento, Orcamento, StatusOrcamento } from '@/types'

const COLLECTION = 'orcamentos'

function formatCodigo(sequencial: number): string {
  return `ORC-${String(sequencial).padStart(4, '0')}`
}

export async function listOrcamentos(): Promise<Orcamento[]> {
  return [...listRows(COLLECTION)].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )
}

export async function getOrcamento(id: string): Promise<Orcamento> {
  const orcamento = findRow(COLLECTION, id)
  if (!orcamento) {
    throw new Error('Orcamento nao encontrado')
  }
  return orcamento
}

export async function createOrcamento(
  input: NovoOrcamento,
  createdBy: string,
): Promise<Orcamento> {
  const timestamp = nowIso()
  return insertRow(COLLECTION, {
    id: generateId(),
    codigo: formatCodigo(nextCounter('orcamento_codigo')),
    cliente: input.cliente,
    peca: input.peca,
    quantidade: input.quantidade,
    valor_estimado: input.valor_estimado,
    status: input.status ?? 'rascunho',
    observacoes: input.observacoes ?? null,
    ordem_producao_id: null,
    created_by: createdBy,
    created_at: timestamp,
    updated_at: timestamp,
  })
}

export async function updateOrcamento(
  id: string,
  input: Partial<NovoOrcamento>,
): Promise<Orcamento> {
  return updateRow(COLLECTION, id, { ...input, updated_at: nowIso() })
}

export async function updateStatusOrcamento(
  id: string,
  status: StatusOrcamento,
): Promise<Orcamento> {
  return updateRow(COLLECTION, id, { status, updated_at: nowIso() })
}

export async function deleteOrcamento(id: string): Promise<void> {
  const orcamento = await getOrcamento(id)
  if (orcamento.ordem_producao_id) {
    throw new Error('Orcamento ja convertido em OP nao pode ser excluido')
  }
  deleteRow(COLLECTION, id)
}
