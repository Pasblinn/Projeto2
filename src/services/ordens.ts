import { supabase } from '@/services/supabase'
import type { NovaOrdemProducao, OrdemProducao } from '@/types'

const TABLE = 'ordens_producao'

const SELECT_COLUMNS =
  'id, numero, tipo, cliente, descricao, quantidade, quantidade_produzida, ' +
  'data_entrega, status_producao, status_financeiro, forma_pagamento, ' +
  'valor_total, valor_pago, observacoes, aprovada, aprovada_por, aprovada_em, ' +
  'criada_por, created_at, updated_at'

export async function listOrdens(): Promise<OrdemProducao[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .order('numero', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as OrdemProducao[]
}

export async function getOrdem(id: string): Promise<OrdemProducao> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as OrdemProducao
}

export async function createOrdem(
  input: NovaOrdemProducao,
  criadaPor: string,
): Promise<OrdemProducao> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...input, criada_por: criadaPor })
    .select(SELECT_COLUMNS)
    .single()

  if (error) throw new Error(error.message)
  return data as OrdemProducao
}
