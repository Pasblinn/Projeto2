import {
  deleteRow,
  findRow,
  generateId,
  insertRow,
  nowIso,
  query,
  updateRow,
} from '@/services/db'
import type {
  AtualizaOrdemProducao,
  NovaOrdemProducao,
  OrdemProducao,
  StatusProducao,
} from '@/types'

const COLLECTION = 'ordens_producao'

// Mirrors the official gerar_codigo_op(): OP-<ano>-<sequencial por ano>.
async function gerarCodigo(): Promise<string> {
  const ano = String(new Date().getFullYear())
  const prefixo = `OP-${ano}-`
  const rows = await query<{ total: number }>(
    'SELECT COUNT(*)::int AS total FROM ordens_producao WHERE codigo LIKE $1',
    [`${prefixo}%`],
  )
  const contador = rows[0].total + 1
  return `${prefixo}${String(contador).padStart(4, '0')}`
}

export async function listOrdens(): Promise<OrdemProducao[]> {
  return query<OrdemProducao>('SELECT * FROM ordens_producao ORDER BY codigo DESC')
}

export async function getOrdem(id: string): Promise<OrdemProducao> {
  const ordem = await findRow(COLLECTION, id)
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
    codigo: await gerarCodigo(),
    tipo: input.tipo,
    data_inicio: input.data_inicio,
    data_termino: input.data_termino ?? null,
    status_producao: 'criada',
    status_financeiro: 'pendente',
    material: input.material ?? null,
    codigo_descricao_material: input.codigo_descricao_material ?? null,
    quantidade_material: input.quantidade_material ?? null,
    lote: input.lote ?? null,
    fornecedor: input.fornecedor ?? null,
    observacoes_material: input.observacoes_material ?? null,
    cliente: input.cliente,
    cnpj_cliente: input.cnpj_cliente ?? null,
    nome_peca: input.nome_peca,
    quantidade_total: input.quantidade_total,
    unidade: input.unidade ?? null,
    preco_servico: input.preco_servico,
    preco_material: input.preco_material ?? null,
    maquina_utilizada: input.maquina_utilizada ?? null,
    operador_responsavel: input.operador_responsavel ?? null,
    preparacao_maquina_segundos: 0,
    preparacao_maquina_inicio: null,
    aprovada: false,
    supervisor_nome: null,
    supervisor_data_aprovacao: null,
    forma_pagamento: input.forma_pagamento ?? null,
    valor_pago: 0,
    observacoes: input.observacoes ?? null,
    criada_por: criadaPor,
    created_at: timestamp,
    updated_at: timestamp,
  })
}

export async function updateOrdem(
  id: string,
  input: AtualizaOrdemProducao,
): Promise<OrdemProducao> {
  const ordem = await getOrdem(id)
  if (ordem.aprovada) {
    throw new Error('OP aprovada nao pode ser editada')
  }
  return updateRow(COLLECTION, id, { ...input, updated_at: nowIso() })
}

export async function updateStatusProducao(
  id: string,
  status: StatusProducao,
): Promise<OrdemProducao> {
  const ordem = await getOrdem(id)

  // Cancelling an order with nothing received also closes its finance
  // side, so it stops showing up in contas a receber.
  const statusFinanceiro =
    status === 'cancelada' && ordem.valor_pago === 0
      ? 'cancelado'
      : ordem.status_financeiro

  return updateRow(COLLECTION, id, {
    status_producao: status,
    status_financeiro: statusFinanceiro,
    updated_at: nowIso(),
  })
}

export async function aprovarOrdem(
  id: string,
  supervisorNome: string,
): Promise<OrdemProducao> {
  return updateRow(COLLECTION, id, {
    aprovada: true,
    supervisor_nome: supervisorNome,
    supervisor_data_aprovacao: nowIso(),
    updated_at: nowIso(),
  })
}

export async function setPreparacaoMaquina(
  id: string,
  segundos: number,
  inicio: string | null,
): Promise<OrdemProducao> {
  return updateRow(COLLECTION, id, {
    preparacao_maquina_segundos: segundos,
    preparacao_maquina_inicio: inicio,
    updated_at: nowIso(),
  })
}

export async function deleteOrdem(id: string): Promise<void> {
  await getOrdem(id)

  // Unlink converted quotes; production logs, defects, payments and
  // invoices are removed by the ON DELETE CASCADE foreign keys.
  await query(
    'UPDATE orcamentos SET ordem_producao_id = NULL WHERE ordem_producao_id = $1',
    [id],
  )
  await deleteRow(COLLECTION, id)
}
