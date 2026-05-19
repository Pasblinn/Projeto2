import { Link } from 'react-router-dom'
import Card from '@/components/Card'

function Forbidden() {
  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-full max-w-md" padding="lg">
        <div className="text-center">
          <p className="text-sm font-medium text-red-600">Erro 403</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">Acesso negado</h1>
          <p className="mt-2 text-sm text-gray-500">
            Seu perfil nao possui permissao para acessar esta area.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default Forbidden
