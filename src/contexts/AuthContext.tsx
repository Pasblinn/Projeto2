import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  getCurrentUser,
  getSession,
  LocalSession,
  signIn as signInLocal,
  signOut as signOutLocal,
} from '@/services/auth'
import type { User, UserRole } from '@/types'

interface AuthContextValue {
  session: LocalSession | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  hasRole: (role: UserRole | UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<LocalSession | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    getCurrentUser().then((currentUser) => {
      if (!active) return
      setUser(currentUser)
      setSession(currentUser ? getSession() : null)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const signedUser = await signInLocal(email, password)
    setUser(signedUser)
    setSession(getSession())
  }, [])

  const signOut = useCallback(async () => {
    signOutLocal()
    setUser(null)
    setSession(null)
  }, [])

  const hasRole = useCallback(
    (role: UserRole | UserRole[]) => {
      if (!user) return false
      const roles = Array.isArray(role) ? role : [role]
      return roles.includes(user.role)
    },
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ session, user, loading, signIn, signOut, hasRole }),
    [session, user, loading, signIn, signOut, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return ctx
}
