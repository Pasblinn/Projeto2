import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-center">
      <div>
        <p className="text-sm font-medium text-primary-600">Erro 404</p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">Pagina nao encontrada</h1>
        <p className="mt-2 text-sm text-gray-500">
          A rota acessada nao existe ou foi removida.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  )
}

export default NotFound
