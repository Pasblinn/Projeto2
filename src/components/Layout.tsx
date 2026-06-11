import { ComponentType, ReactNode, useState } from 'react'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Factory,
  LayoutDashboard,
  LogOut,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import type { UserRole } from '@/types'

type IconComponent = ComponentType<{ size?: number | string; className?: string }>

interface NavItem {
  key: string
  label: string
  icon: IconComponent
  roles?: UserRole[]
}

interface LayoutProps {
  activeKey: string
  onNavigate: (key: string) => void
  children: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'ordens', label: 'Ordens de Producao', icon: ClipboardList },
  { key: 'financeiro', label: 'Financeiro', icon: Wallet, roles: ['financeiro'] },
  { key: 'relatorios', label: 'Relatorios', icon: BarChart3, roles: ['financeiro'] },
]

const ROLE_LABEL: Record<UserRole, string> = {
  financeiro: 'Financeiro',
  chefe: 'Chefe de Producao',
  operador: 'Operador',
}

function initials(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('')
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
        className={`no-print flex flex-col bg-slate-900 text-slate-300 transition-all duration-200 ${
          collapsed ? 'w-[4.5rem]' : 'w-64'
        }`}
      >
        <div
          className={`flex items-center gap-3 border-b border-slate-800 px-4 py-5 ${
            collapsed ? 'justify-center px-2' : ''
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
            <Factory size={20} />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-wide text-white">
                RJ USINAGEM
              </p>
              <p className="truncate text-[11px] uppercase tracking-widest text-slate-500">
                Sistema de Gestao
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {!collapsed && (
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Menu
            </p>
          )}
          <ul className="flex flex-col gap-1">
            {visibleItems.map((item) => {
              const active = item.key === activeKey
              const Icon = item.icon
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    title={collapsed ? item.label : undefined}
                    onClick={() => onNavigate(item.key)}
                    className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      collapsed ? 'justify-center px-2' : ''
                    } ${
                      active
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {active && !collapsed && (
                      <span className="absolute -left-3 h-6 w-1 rounded-r bg-primary-400" />
                    )}
                    <Icon size={19} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-800 p-3">
          {user && (
            <div
              className={`mb-2 flex items-center gap-3 rounded-lg bg-slate-800/60 px-3 py-2.5 ${
                collapsed ? 'justify-center px-2' : ''
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                {initials(user.nome)}
              </span>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{user.nome}</p>
                  <p className="truncate text-xs text-slate-500">{ROLE_LABEL[user.role]}</p>
                </div>
              )}
            </div>
          )}
          <div className={`flex gap-1 ${collapsed ? 'flex-col items-center' : ''}`}>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sair"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400 ${
                collapsed ? 'justify-center px-2' : 'flex-1'
              }`}
            >
              <LogOut size={16} />
              {!collapsed && <span>Sair</span>}
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              title={collapsed ? 'Expandir menu' : 'Recolher menu'}
              aria-label="Alternar menu"
              className="flex items-center justify-center rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="no-print border-b border-gray-200 bg-white px-6 py-4">
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
