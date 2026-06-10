import {
  DbUser,
  generateId,
  insertRow,
  listRows,
  nowIso,
} from '@/services/db'
import type { User, UserRole } from '@/types'

/**
 * Local authentication: users live in the local database and the active
 * session is a pointer to the signed-in user. Passwords are stored as
 * SHA-256 hashes; this protects against casual inspection only, which is
 * acceptable for a single-machine offline deployment.
 */

export interface LocalSession {
  userId: string
  createdAt: string
}

const SESSION_KEY = 'rjusinagem.session.v1'

interface SeedUser {
  email: string
  nome: string
  role: UserRole
  password: string
}

// Default credentials for first access; documented in docs/DATABASE.md.
const SEED_USERS: SeedUser[] = [
  {
    email: 'admin@rjusinagem.com.br',
    nome: 'Administrador',
    role: 'financeiro',
    password: 'admin123',
  },
  {
    email: 'chefe@rjusinagem.com.br',
    nome: 'Chefe de Producao',
    role: 'chefe',
    password: 'chefe123',
  },
  {
    email: 'operador@rjusinagem.com.br',
    nome: 'Operador',
    role: 'operador',
    password: 'operador123',
  },
]

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function toPublicUser(user: DbUser): User {
  const { password_hash: _hash, ...publicUser } = user
  return publicUser
}

// Single in-flight promise: React StrictMode mounts effects twice in dev,
// and two concurrent seeds would both pass the empty check (hashing is
// async) and insert duplicated users.
let seedUsersPromise: Promise<void> | null = null

export function ensureSeedUsers(): Promise<void> {
  if (!seedUsersPromise) {
    seedUsersPromise = seedUsers().finally(() => {
      seedUsersPromise = null
    })
  }
  return seedUsersPromise
}

async function seedUsers(): Promise<void> {
  if (listRows('users').length > 0) return

  const rows: DbUser[] = await Promise.all(
    SEED_USERS.map(async (seed) => ({
      id: generateId(),
      email: seed.email,
      nome: seed.nome,
      role: seed.role,
      password_hash: await hashPassword(seed.password),
      created_at: nowIso(),
      updated_at: nowIso(),
    })),
  )

  // Re-check after the async hashing: another tab/window may have seeded.
  if (listRows('users').length > 0) return
  rows.forEach((row) => insertRow('users', row))
}

export function getSession(): LocalSession | null {
  const raw = window.localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as LocalSession
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  await ensureSeedUsers()
  const session = getSession()
  if (!session) return null

  const user = listRows('users').find((u) => u.id === session.userId)
  return user ? toPublicUser(user) : null
}

export async function signIn(email: string, password: string): Promise<User> {
  await ensureSeedUsers()

  const normalizedEmail = email.trim().toLowerCase()
  const passwordHash = await hashPassword(password)
  const user = listRows('users').find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password_hash === passwordHash,
  )

  if (!user) {
    throw new Error('E-mail ou senha invalidos')
  }

  const session: LocalSession = { userId: user.id, createdAt: nowIso() }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return toPublicUser(user)
}

export function signOut(): void {
  window.localStorage.removeItem(SESSION_KEY)
}
