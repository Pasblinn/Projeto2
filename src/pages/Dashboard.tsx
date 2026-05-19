import Card from '@/components/Card'
import { useAuth } from '@/contexts/AuthContext'

function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-6">
      <Card title={`Bem-vindo, ${user?.nome ?? ''}`}>
        <p className="text-sm text-gray-600">
          Painel principal do sistema. As cartas com indicadores serao
          adicionadas na proxima fase, junto com a listagem de Ordens de
          Producao.
        </p>
      </Card>
    </div>
  )
}

export default Dashboard
