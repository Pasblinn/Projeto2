import { ToastProvider } from '@/contexts/ToastContext'
import ToastContainer from '@/components/Toast'

function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            RJ Usinagem - Sistema de Gestao
          </h1>
        </header>
      </div>
      <ToastContainer />
    </ToastProvider>
  )
}

export default App
