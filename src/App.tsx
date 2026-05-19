import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import ToastContainer from '@/components/Toast'
import ProtectedRoute from '@/components/ProtectedRoute'
import RoleGuard from '@/components/RoleGuard'
import AppLayout from '@/components/AppLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Ordens from '@/pages/Ordens'
import Producao from '@/pages/Producao'
import Financeiro from '@/pages/Financeiro'
import Relatorios from '@/pages/Relatorios'
import Ponto from '@/pages/Ponto'
import Forbidden from '@/pages/Forbidden'
import NotFound from '@/pages/NotFound'

function App() {
  return (
    <BrowserRouter>
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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ordens" element={<Ordens />} />
              <Route
                path="/producao"
                element={
                  <RoleGuard allow={['chefe', 'financeiro']} fallback="/403">
                    <Producao />
                  </RoleGuard>
                }
              />
              <Route
                path="/financeiro"
                element={
                  <RoleGuard allow="financeiro" fallback="/403">
                    <Financeiro />
                  </RoleGuard>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <RoleGuard allow="financeiro" fallback="/403">
                    <Relatorios />
                  </RoleGuard>
                }
              />
              <Route
                path="/ponto"
                element={
                  <RoleGuard allow={['financeiro', 'chefe']} fallback="/403">
                    <Ponto />
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
    </BrowserRouter>
  )
}

export default App
