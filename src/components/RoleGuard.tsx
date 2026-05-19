import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'

interface RoleGuardProps {
  allow: UserRole | UserRole[]
  fallback?: string
  children: ReactNode
}

function RoleGuard({ allow, fallback = '/dashboard', children }: RoleGuardProps) {
  const { user, loading, hasRole } = useAuth()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-16">
        <p className="text-sm text-gray-500">Verificando permissoes...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!hasRole(allow)) {
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}

export default RoleGuard
