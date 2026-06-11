import {
  deleteRow,
  findRow,
  generateId,
  insertRow,
  listRows,
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

// Mirrors the official gerar_codigo_op(): OP-<ano>-<sequencial por ano>.
function gerarCodigo(): string {
  const ano = String(new Date().getFullYear())
  const prefixo = `OP-${ano}-`
  const contador =
    listRows(COLLECTION).filter((ordem) => ordem.codigo.startsWith(prefixo)).length + 1
  return `${prefixo}${String(contador).padStart(4, '0')}`
}

export async function listOrdens(): Promise<OrdemProducao[]> {
  return [...listRows(COLLECTION)].sort((a, b) => b.codigo.localeCompare(a.codigo))
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
    codigo: gerarCodigo(),
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
  return updateRow(COLLECTION, id, {
    status_producao: status,
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

  // Cascade: remove everything that references the OP, like the official
  // schema does with ON DELETE CASCADE.
  for (const registro of listRows('registros_producao')) {
    if (registro.ordem_producao_id === id) deleteRow('registros_producao', registro.id)
  }
  for (const defeito of listRows('registros_defeito')) {
    if (defeito.ordem_producao_id === id) deleteRow('registros_defeito', defeito.id)
  }
  for (const movimento of listRows('movimentos_financeiros')) {
    if (movimento.ordem_producao_id === id)
      deleteRow('movimentos_financeiros', movimento.id)
  }
  for (const nota of listRows('notas_fiscais')) {
    if (nota.ordem_producao_id === id) deleteRow('notas_fiscais', nota.id)
  }
  for (const orcamento of listRows('orcamentos')) {
    if (orcamento.ordem_producao_id === id) {
      updateRow('orcamentos', orcamento.id, { ordem_producao_id: null })
    }
  }

  deleteRow(COLLECTION, id)
}
