import { supabase } from '@/services/supabase'
import type { OrdemProducao } from '@/types'

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
