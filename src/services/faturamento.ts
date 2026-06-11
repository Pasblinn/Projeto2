import { findRow, generateId, insertRow, nextCounter, nowIso, query } from '@/services/db'
import type { NotaFiscal } from '@/types'

const COLLECTION = 'notas_fiscais'

export function formatNotaNumero(numero: number): string {
  return `NF-${String(numero).padStart(6, '0')}`
}

export async function listNotas(): Promise<NotaFiscal[]> {
  return query<NotaFiscal>('SELECT * FROM notas_fiscais ORDER BY numero DESC')
}

export async function emitirNota(
  ordemId: string,
  valor: number,
  dataEmissao: string,
  observacoes: string | null,
  emitidaPor: string,
): Promise<NotaFiscal> {
  const ordem = await findRow('ordens_producao', ordemId)
  if (!ordem) {
    throw new Error('Ordem de producao nao encontrada')
  }
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error('Valor da nota deve ser maior que zero')
  }

  const existentes = await query<{ id: string }>(
    'SELECT id FROM notas_fiscais WHERE ordem_producao_id = $1',
    [ordemId],
  )
  if (existentes.length > 0) {
    throw new Error('Esta OP ja possui nota fiscal emitida')
  }

  return insertRow(COLLECTION, {
    id: generateId(),
    numero: await nextCounter('nota_numero'),
    ordem_producao_id: ordemId,
    valor,
    data_emissao: dataEmissao,
    observacoes,
    emitida_por: emitidaPor,
    created_at: nowIso(),
  })
}
