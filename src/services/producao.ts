import { findRow, generateId, insertRow, nowIso, query, updateRow } from '@/services/db'
import type {
  NovoRegistroDefeito,
  NovoRegistroProducao,
  RegistroDefeito,
  RegistroProducao,
} from '@/types'

const COLLECTION = 'registros_producao'
const DEFEITOS = 'registros_defeito'

export async function listRegistros(ordemId?: string): Promise<RegistroProducao[]> {
  if (ordemId) {
    return query<RegistroProducao>(
      'SELECT * FROM registros_producao WHERE ordem_producao_id = $1 ORDER BY data DESC, created_at DESC',
      [ordemId],
    )
  }
  return query<RegistroProducao>(
    'SELECT * FROM registros_producao ORDER BY data DESC, created_at DESC',
  )
}

export async function createRegistro(
  input: NovoRegistroProducao,
  registradoPor: string,
): Promise<RegistroProducao> {
  const ordem = await findRow('ordens_producao', input.ordem_producao_id)
  if (!ordem) {
    throw new Error('Ordem de producao nao encontrada')
  }

  return insertRow(COLLECTION, {
    id: generateId(),
    ordem_producao_id: input.ordem_producao_id,
    data: input.data,
    turno: input.turno,
    hora_inicio: input.hora_inicio ?? null,
    hora_fim: input.hora_fim ?? null,
    descricao_operacao: input.descricao_operacao,
    maquina_utilizada: input.maquina_utilizada ?? null,
    pecas_defeituosas: input.pecas_defeituosas,
    observacoes: input.observacoes ?? null,
    registrado_por: registradoPor,
    created_at: nowIso(),
  })
}

export async function updateRegistro(
  id: string,
  input: Partial<NovoRegistroProducao>,
): Promise<RegistroProducao> {
  return updateRow(COLLECTION, id, input)
}

export async function listDefeitos(ordemId?: string): Promise<RegistroDefeito[]> {
  if (ordemId) {
    return query<RegistroDefeito>(
      'SELECT * FROM registros_defeito WHERE ordem_producao_id = $1 ORDER BY created_at DESC',
      [ordemId],
    )
  }
  return query<RegistroDefeito>('SELECT * FROM registros_defeito ORDER BY created_at DESC')
}

export async function createDefeito(
  input: NovoRegistroDefeito,
  registradoPor: string,
): Promise<RegistroDefeito> {
  const ordem = await findRow('ordens_producao', input.ordem_producao_id)
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
