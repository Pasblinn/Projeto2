import { useMemo } from 'react'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'
import Layout from '@/components/Layout'

const ROUTE_KEYS: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/ordens': 'ordens',
  '/financeiro': 'financeiro',
  '/relatorios': 'relatorios',
}

const KEY_TO_ROUTE: Record<string, string> = Object.fromEntries(
  Object.entries(ROUTE_KEYS).map(([route, key]) => [key, route]),
)

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const activeKey = useMemo(() => {
    const entry = Object.entries(ROUTE_KEYS).find(([route]) =>
      location.pathname.startsWith(route),
    )
    return entry?.[1] ?? 'dashboard'
  }, [location.pathname])

  function handleNavigate(key: string) {
    const route = KEY_TO_ROUTE[key]
    if (route) navigate(route)
  }

  return (
    <Layout activeKey={activeKey} onNavigate={handleNavigate}>
      <Outlet />
    </Layout>
  )
}

export default AppLayout
