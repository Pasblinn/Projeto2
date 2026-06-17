import { PGlite } from '@electric-sql/pglite'
import type {
  MovimentoFinanceiro,
  NotaFiscal,
  Orcamento,
  OrdemProducao,
  RegistroDefeito,
  RegistroProducao,
  User,
} from '@/types'

/**
 * Local persistence layer backed by an embedded PostgreSQL database
 * (PGlite — the official Postgres engine compiled to WASM). The data
 * lives entirely on this machine, persisted via IndexedDB; no remote
 * backend is involved.
 */

export interface DbUser extends User {
  password_hash: string
}

export interface DatabaseSchema {
  users: DbUser
  ordens_producao: OrdemProducao
  registros_producao: RegistroProducao
  registros_defeito: RegistroDefeito
  orcamentos: Orcamento
  movimentos_financeiros: MovimentoFinanceiro
  notas_fiscais: NotaFiscal
}

export type CollectionName = keyof DatabaseSchema
export type CounterName = 'orcamento_codigo' | 'nota_numero'

const DATA_DIR = 'idb://rjusinagem'

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    nome TEXT NOT NULL,
    role TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS ordens_producao (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL,
    tipo TEXT NOT NULL,
    data_inicio TEXT NOT NULL,
    data_termino TEXT,
    status_producao TEXT NOT NULL,
    status_financeiro TEXT NOT NULL,
    material TEXT,
    codigo_descricao_material TEXT,
    quantidade_material TEXT,
    lote TEXT,
    fornecedor TEXT,
    observacoes_material TEXT,
    cliente TEXT NOT NULL,
    cnpj_cliente TEXT,
    nome_peca TEXT NOT NULL,
    quantidade_total INTEGER NOT NULL,
    unidade TEXT,
    preco_servico DOUBLE PRECISION NOT NULL DEFAULT 0,
    preco_material DOUBLE PRECISION,
    maquina_utilizada TEXT,
    operador_responsavel TEXT,
    preparacao_maquina_segundos INTEGER NOT NULL DEFAULT 0,
    preparacao_maquina_inicio TEXT,
    aprovada BOOLEAN NOT NULL DEFAULT FALSE,
    supervisor_nome TEXT,
    supervisor_data_aprovacao TEXT,
    forma_pagamento TEXT,
    valor_pago DOUBLE PRECISION NOT NULL DEFAULT 0,
    observacoes TEXT,
    criada_por TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS registros_producao (
    id TEXT PRIMARY KEY,
    ordem_producao_id TEXT NOT NULL REFERENCES ordens_producao(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    turno TEXT NOT NULL,
    hora_inicio TEXT,
    hora_fim TEXT,
    descricao_operacao TEXT NOT NULL,
    maquina_utilizada TEXT,
    pecas_defeituosas INTEGER NOT NULL DEFAULT 0,
    observacoes TEXT,
    registrado_por TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS registros_defeito (
    id TEXT PRIMARY KEY,
    ordem_producao_id TEXT NOT NULL REFERENCES ordens_producao(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    tipo_defeito TEXT NOT NULL,
    causa_provavel TEXT,
    acao_corretiva TEXT,
    registrado_por TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orcamentos (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL,
    cliente TEXT NOT NULL,
    peca TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    valor_estimado DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL,
    observacoes TEXT,
    ordem_producao_id TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS movimentos_financeiros (
    id TEXT PRIMARY KEY,
    ordem_producao_id TEXT NOT NULL REFERENCES ordens_producao(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    valor DOUBLE PRECISION NOT NULL,
    data TEXT NOT NULL,
    descricao TEXT,
    registrado_por TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notas_fiscais (
    id TEXT PRIMARY KEY,
    numero INTEGER NOT NULL,
    ordem_producao_id TEXT NOT NULL REFERENCES ordens_producao(id) ON DELETE CASCADE,
    valor DOUBLE PRECISION NOT NULL,
    data_emissao TEXT NOT NULL,
    observacoes TEXT,
    emitida_por TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS counters (
    name TEXT PRIMARY KEY,
    value INTEGER NOT NULL DEFAULT 0
  );
`

// Migrations applied after the schema on every startup. Idempotent by
// design: they only touch rows still in the old shape.
const MIGRATIONS_SQL = `
  -- Remove o usuario padrao antigo (chefe); o seed o recria como
  -- encarregado@rjusinagem.com.br com a senha nova. Qualquer outro
  -- usuario com papel 'chefe' apenas migra de papel (mantem sua senha).
  DELETE FROM users WHERE email = 'chefe@rjusinagem.com.br';
  UPDATE users SET role = 'encarregado' WHERE role = 'chefe';
`

let dbPromise: Promise<PGlite> | null = null

function getDb(): Promise<PGlite> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = new PGlite(DATA_DIR)
      await db.exec(SCHEMA_SQL)
      await db.exec(MIGRATIONS_SQL)
      return db
    })()
  }
  return dbPromise
}

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const db = await getDb()
  const result = await db.query<T>(sql, params)
  return result.rows
}

export async function listRows<K extends CollectionName>(
  name: K,
): Promise<DatabaseSchema[K][]> {
  return query<DatabaseSchema[K]>(`SELECT * FROM ${name}`)
}

export async function findRow<K extends CollectionName>(
  name: K,
  id: string,
): Promise<DatabaseSchema[K] | undefined> {
  const rows = await query<DatabaseSchema[K]>(`SELECT * FROM ${name} WHERE id = $1`, [id])
  return rows[0]
}

export async function insertRow<K extends CollectionName>(
  name: K,
  row: DatabaseSchema[K],
): Promise<DatabaseSchema[K]> {
  const entries = Object.entries(row as unknown as Record<string, unknown>)
  const columns = entries.map(([column]) => column)
  const placeholders = columns.map((_, index) => `$${index + 1}`)
  const values = entries.map(([, value]) => value ?? null)

  const rows = await query<DatabaseSchema[K]>(
    `INSERT INTO ${name} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
    values,
  )
  return rows[0]
}

export async function updateRow<K extends CollectionName>(
  name: K,
  id: string,
  patch: Partial<DatabaseSchema[K]>,
): Promise<DatabaseSchema[K]> {
  const entries = Object.entries(patch as Record<string, unknown>).filter(
    ([, value]) => value !== undefined,
  )
  if (entries.length === 0) {
    const existing = await findRow(name, id)
    if (!existing) throw new Error(`Registro ${id} nao encontrado em ${name}`)
    return existing
  }

  const assignments = entries.map(([column], index) => `${column} = $${index + 1}`)
  const values = entries.map(([, value]) => value ?? null)

  const rows = await query<DatabaseSchema[K]>(
    `UPDATE ${name} SET ${assignments.join(', ')} WHERE id = $${entries.length + 1} RETURNING *`,
    [...values, id],
  )
  if (rows.length === 0) {
    throw new Error(`Registro ${id} nao encontrado em ${name}`)
  }
  return rows[0]
}

export async function deleteRow<K extends CollectionName>(
  name: K,
  id: string,
): Promise<void> {
  const rows = await query<{ id: string }>(
    `DELETE FROM ${name} WHERE id = $1 RETURNING id`,
    [id],
  )
  if (rows.length === 0) {
    throw new Error(`Registro ${id} nao encontrado em ${name}`)
  }
}

export async function nextCounter(name: CounterName): Promise<number> {
  const rows = await query<{ value: number }>(
    `INSERT INTO counters (name, value) VALUES ($1, 1)
     ON CONFLICT (name) DO UPDATE SET value = counters.value + 1
     RETURNING value`,
    [name],
  )
  return rows[0].value
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}
