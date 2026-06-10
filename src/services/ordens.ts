import {
  findRow,
  generateId,
  insertRow,
  listRows,
  nextCounter,
  nowIso,
  updateRow,
} from '@/services/db'
import type {
  AtualizaOrdemProducao,
  NovaOrdemProducao,
  OrdemProducao,
  StatusProducao,
} from '@/types'

const COLLECTION = 'ordens_producao'

export async function listOrdens(): Promise<OrdemProducao[]> {
  return [...listRows(COLLECTION)].sort((a, b) => b.numero - a.numero)
}

export async function getOrdem(id: string): Promise<OrdemProducao> {
  const ordem = findRow(COLLECTION, id)
  if (!ordem) {
    throw new Error('Ordem de producao nao encontrada')
  }
  return ordem
}

export async function createOrdem(
  input: NovaOrdemProducao,
  criadaPor: string,
): Promise<OrdemProducao> {
  const timestamp = nowIso()
  return insertRow(COLLECTION, {
    id: generateId(),
    numero: nextCounter('ordem_numero'),
    tipo: input.tipo,
    cliente: input.cliente,
    descricao: input.descricao,
    quantidade: input.quantidade,
    quantidade_produzida: 0,
    data_entrega: input.data_entrega ?? null,
    status_producao: 'criada',
    status_financeiro: 'pendente',
    forma_pagamento: input.forma_pagamento ?? null,
    valor_total: input.valor_total ?? null,
    valor_pago: 0,
    observacoes: input.observacoes ?? null,
    aprovada: false,
    aprovada_por: null,
    aprovada_em: null,
    criada_por: criadaPor,
    created_at: timestamp,
    updated_at: timestamp,
  })
}

export async function updateOrdem(
  id: string,
  input: AtualizaOrdemProducao,
): Promise<OrdemProducao> {
  return updateRow(COLLECTION, id, { ...input, updated_at: nowIso() })
}

export async function updateStatusProducao(
  id: string,
  status: StatusProducao,
): Promise<OrdemProducao> {
  return updateRow(COLLECTION, id, {
    status_producao: status,
    updated_at: nowIso(),
  })
}

export async function aprovarOrdem(
  id: string,
  aprovadaPor: string,
): Promise<OrdemProducao> {
  return updateRow(COLLECTION, id, {
    aprovada: true,
    aprovada_por: aprovadaPor,
    aprovada_em: nowIso(),
    updated_at: nowIso(),
  })
}
