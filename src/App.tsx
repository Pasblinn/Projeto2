import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import ToastContainer from '@/components/Toast'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Ordens from '@/pages/Ordens'
import Producao from '@/pages/Producao'
import Financeiro from '@/pages/Financeiro'
import Relatorios from '@/pages/Relatorios'
import Ponto from '@/pages/Ponto'
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
              <Route path="/producao" element={<Producao />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/ponto" element={<Ponto />} />
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
