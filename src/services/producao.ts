import {
  findRow,
  generateId,
  insertRow,
  listRows,
  nowIso,
  updateRow,
} from '@/services/db'
import type {
  NovoRegistroDefeito,
  NovoRegistroProducao,
  RegistroDefeito,
  RegistroProducao,
} from '@/types'

const COLLECTION = 'registros_producao'
const DEFEITOS = 'registros_defeito'

export async function listRegistros(ordemId?: string): Promise<RegistroProducao[]> {
  const registros = listRows(COLLECTION).filter(
    (registro) => !ordemId || registro.ordem_producao_id === ordemId,
  )
  return registros.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function createRegistro(
  input: NovoRegistroProducao,
  registradoPor: string,
): Promise<RegistroProducao> {
  const ordem = findRow('ordens_producao', input.ordem_producao_id)
  if (!ordem) {
    throw new Error('Ordem de producao nao encontrada')
  }

  const registro = insertRow(COLLECTION, {
    id: generateId(),
    ordem_producao_id: input.ordem_producao_id,
    data: input.data,
    turno: input.turno,
    quantidade_produzida: input.quantidade_produzida,
    pecas_defeituosas: input.pecas_defeituosas,
    observacoes: input.observacoes ?? null,
    registrado_por: registradoPor,
    created_at: nowIso(),
  })

  updateRow('ordens_producao', ordem.id, {
    quantidade_produzida: ordem.quantidade_produzida + input.quantidade_produzida,
    updated_at: nowIso(),
  })

  return registro
}

export async function listDefeitos(ordemId?: string): Promise<RegistroDefeito[]> {
  const defeitos = listRows(DEFEITOS).filter(
    (defeito) => !ordemId || defeito.ordem_producao_id === ordemId,
  )
  return defeitos.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function createDefeito(
  input: NovoRegistroDefeito,
  registradoPor: string,
): Promise<RegistroDefeito> {
  const ordem = findRow('ordens_producao', input.ordem_producao_id)
  if (!ordem) {
    throw new Error('Ordem de producao nao encontrada')
  }

  return insertRow(DEFEITOS, {
    id: generateId(),
    ordem_producao_id: input.ordem_producao_id,
    data: input.data,
    quantidade: input.quantidade,
    tipo_defeito: input.tipo_defeito,
    causa_provavel: input.causa_provavel ?? null,
    acao_corretiva: input.acao_corretiva ?? null,
    registrado_por: registradoPor,
    created_at: nowIso(),
  })
}
