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
 * Local persistence layer backed by localStorage. The app runs fully
 * offline: every collection lives under a single storage key and is
 * read/written atomically to keep the snapshot consistent.
 */

export interface DbUser extends User {
  password_hash: string
}

export interface DatabaseSchema {
  users: DbUser[]
  ordens_producao: OrdemProducao[]
  registros_producao: RegistroProducao[]
  registros_defeito: RegistroDefeito[]
  orcamentos: Orcamento[]
  movimentos_financeiros: MovimentoFinanceiro[]
  notas_fiscais: NotaFiscal[]
}

export interface DatabaseCounters {
  orcamento_codigo: number
  nota_numero: number
}

interface DatabaseFile {
  collections: DatabaseSchema
  counters: DatabaseCounters
}

export type CollectionName = keyof DatabaseSchema
export type CounterName = keyof DatabaseCounters

const STORAGE_KEY = 'rjusinagem.db.v1'

function emptyDatabase(): DatabaseFile {
  return {
    collections: {
      users: [],
      ordens_producao: [],
      registros_producao: [],
      registros_defeito: [],
      orcamentos: [],
      movimentos_financeiros: [],
      notas_fiscais: [],
    },
    counters: {
      orcamento_codigo: 0,
      nota_numero: 0,
    },
  }
}

function loadDatabase(): DatabaseFile {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return emptyDatabase()

  try {
    const parsed = JSON.parse(raw) as Partial<DatabaseFile>
    const fresh = emptyDatabase()
    return {
      collections: { ...fresh.collections, ...parsed.collections },
      counters: { ...fresh.counters, ...parsed.counters },
    }
  } catch {
    // A corrupted snapshot should not brick the app; start clean.
    return emptyDatabase()
  }
}

function saveDatabase(db: DatabaseFile): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

export function listRows<K extends CollectionName>(name: K): DatabaseSchema[K] {
  return loadDatabase().collections[name]
}

export function findRow<K extends CollectionName>(
  name: K,
  id: string,
): DatabaseSchema[K][number] | undefined {
  return listRows(name).find((row) => row.id === id)
}

export function insertRow<K extends CollectionName>(
  name: K,
  row: DatabaseSchema[K][number],
): DatabaseSchema[K][number] {
  const db = loadDatabase()
  const rows = db.collections[name] as DatabaseSchema[K][number][]
  rows.push(row)
  saveDatabase(db)
  return row
}

export function updateRow<K extends CollectionName>(
  name: K,
  id: string,
  patch: Partial<DatabaseSchema[K][number]>,
): DatabaseSchema[K][number] {
  const db = loadDatabase()
  const rows = db.collections[name] as DatabaseSchema[K][number][]
  const index = rows.findIndex((row) => row.id === id)
  if (index < 0) {
    throw new Error(`Registro ${id} nao encontrado em ${name}`)
  }
  rows[index] = { ...rows[index], ...patch }
  saveDatabase(db)
  return rows[index]
}

export function deleteRow<K extends CollectionName>(name: K, id: string): void {
  const db = loadDatabase()
  const rows = db.collections[name] as DatabaseSchema[K][number][]
  const index = rows.findIndex((row) => row.id === id)
  if (index < 0) {
    throw new Error(`Registro ${id} nao encontrado em ${name}`)
  }
  rows.splice(index, 1)
  saveDatabase(db)
}

export function nextCounter(name: CounterName): number {
  const db = loadDatabase()
  db.counters[name] += 1
  saveDatabase(db)
  return db.counters[name]
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}
