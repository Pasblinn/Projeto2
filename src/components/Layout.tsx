import { ReactNode, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import type { UserRole } from '@/types'

interface NavItem {
  key: string
  label: string
  icon: string
  roles?: UserRole[]
}

interface LayoutProps {
  activeKey: string
  onNavigate: (key: string) => void
  children: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'D' },
  { key: 'ordens', label: 'Ordens de Producao', icon: 'O' },
  { key: 'producao', label: 'Registrar Producao', icon: 'P', roles: ['chefe', 'financeiro'] },
  { key: 'financeiro', label: 'Financeiro', icon: 'F', roles: ['financeiro'] },
  { key: 'relatorios', label: 'Relatorios', icon: 'R', roles: ['financeiro'] },
  { key: 'ponto', label: 'Ponto Eletronico', icon: 'T', roles: ['financeiro', 'chefe'] },
]

const ROLE_LABEL: Record<UserRole, string> = {
  financeiro: 'Financeiro',
  chefe: 'Chefe de Producao',
  operador: 'Operador',
}

function Layout({ activeKey, onNavigate, children }: LayoutProps) {
  const { user, signOut, hasRole } = useAuth()
  const toast = useToast()
  const [collapsed, setCollapsed] = useState(false)

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || hasRole(item.roles))

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Sessao encerrada')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao sair'
      toast.error(message)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside
        className={`flex flex-col border-r border-gray-200 bg-white transition-all ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
          {!collapsed && (
            <span className="text-base font-semibold text-gray-900">RJ Usinagem</span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Alternar menu"
          >
            {collapsed ? '>' : '<'}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="flex flex-col gap-1">
            {visibleItems.map((item) => {
              const active = item.key === activeKey
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.key)}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                      active
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-semibold ${
                        active ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-gray-200 p-3">
          {!collapsed && user && (
            <div className="mb-2 px-1">
              <p className="truncate text-sm font-medium text-gray-900">{user.nome}</p>
              <p className="truncate text-xs text-gray-500">{ROLE_LABEL[user.role]}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            {collapsed ? 'X' : 'Sair'}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-900">
            {visibleItems.find((i) => i.key === activeKey)?.label ?? 'Painel'}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

export default Layout
