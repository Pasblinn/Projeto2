import { ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import Card from '@/components/Card'
import DashboardTab from '@/components/financeiro/DashboardTab'

export type FinanceiroTab =
  | 'dashboard'
  | 'orcamentos'
  | 'contas'
  | 'movimentos'
  | 'faturamento'
  | 'relatorios'

const TABS: { key: FinanceiroTab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'orcamentos', label: 'Orcamentos' },
  { key: 'contas', label: 'Contas a Receber' },
  { key: 'movimentos', label: 'OPs e Financeiro' },
  { key: 'faturamento', label: 'Faturamento' },
  { key: 'relatorios', label: 'Relatorios' },
]

function Placeholder({ children }: { children: ReactNode }) {
  return (
    <Card>
      <p className="text-sm text-gray-600">{children}</p>
    </Card>
  )
}

function Financeiro() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<FinanceiroTab>('dashboard')

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-4" aria-label="Abas do financeiro">
          {TABS.map((item) => {
            const active = item.key === tab
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition ${
                  active
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'orcamentos' && (
        <Placeholder>CRUD de orcamentos sera implementado em breve.</Placeholder>
      )}
      {tab === 'contas' && (
        <Placeholder>Contas a receber sera implementado em breve.</Placeholder>
      )}
      {tab === 'movimentos' && (
        <Placeholder>Historico financeiro por OP sera implementado em breve.</Placeholder>
      )}
      {tab === 'faturamento' && (
        <Placeholder>Faturamento sera implementado em breve.</Placeholder>
      )}
      {tab === 'relatorios' && (
        <Card title="Relatorios">
          <p className="mb-4 text-sm text-gray-600">
            Os relatorios imprimiveis em A4 ficam em uma pagina dedicada.
          </p>
          <Button variant="primary" size="sm" onClick={() => navigate('/relatorios')}>
            Abrir Relatorios
          </Button>
        </Card>
      )}
    </div>
  )
}

export default Financeiro
