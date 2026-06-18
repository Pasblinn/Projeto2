import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import ToastContainer from '@/components/Toast'
import ProtectedRoute from '@/components/ProtectedRoute'
import RoleGuard from '@/components/RoleGuard'
import AppLayout from '@/components/AppLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import OrdensProducao from '@/pages/OrdensProducao'
import OrdemDetalhes from '@/pages/OrdemDetalhes'
import Financeiro from '@/pages/Financeiro'
import Relatorios from '@/pages/Relatorios'
import Forbidden from '@/pages/Forbidden'
import NotFound from '@/pages/NotFound'
import type { UserRole } from '@/types'

// Dono e encarregado acessam Financeiro/Relatorios; o Dashboard executivo
// eh exclusivo do dono. Operador fica restrito as OPs.
const GESTORES: UserRole[] = ['dono', 'encarregado']
const SO_DONO: UserRole[] = ['dono']

function App() {
  // HashRouter: in the packaged Electron app the page loads via file://,
  // where history-based routing (BrowserRouter) cannot resolve paths.
  return (
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route
                path="/dashboard"
                element={
                  <RoleGuard allow={SO_DONO} fallback="/ordens">
                    <Dashboard />
                  </RoleGuard>
                }
              />
              <Route path="/ordens" element={<OrdensProducao />} />
              <Route path="/ordens/:id" element={<OrdemDetalhes />} />
              <Route
                path="/financeiro"
                element={
                  <RoleGuard allow={GESTORES} fallback="/403">
                    <Financeiro />
                  </RoleGuard>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <RoleGuard allow={GESTORES} fallback="/403">
                    <Relatorios />
                  </RoleGuard>
                }
              />
              <Route path="/403" element={<Forbidden />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ToastContainer />
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  )
}

export default App
