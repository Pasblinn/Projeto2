import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Modal from '@/components/Modal'
import OrdemForm from '@/components/OrdemForm'
import Select from '@/components/Select'
import StatusBadge from '@/components/StatusBadge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { createOrdem, listOrdens } from '@/services/ordens'
import type {
  NovaOrdemProducao,
  OrdemProducao,
  StatusFinanceiro,
  StatusProducao,
} from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'

const PRODUCAO_FILTER_OPTIONS: { value: StatusProducao | ''; label: string }[] = [
  { value: '', label: 'Producao: todas' },
  { value: 'criada', label: 'Criada' },
  { value: 'em_producao', label: 'Em producao' },
  { value: 'pausada', label: 'Pausada' },
  { value: 'finalizada', label: 'Finalizada' },
  { value: 'cancelada', label: 'Cancelada' },
]

const FINANCEIRO_FILTER_OPTIONS: { value: StatusFinanceiro | ''; label: string }[] = [
  { value: '', label: 'Financeiro: todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'pago', label: 'Pago' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'cancelado', label: 'Cancelado' },
]

function Dashboard() {
  const toast = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [ordens, setOrdens] = useState<OrdemProducao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [filtroProducao, setFiltroProducao] = useState<StatusProducao | ''>('')
  const [filtroFinanceiro, setFiltroFinanceiro] = useState<StatusFinanceiro | ''>('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setOrdens(await listOrdens())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar OPs'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const ordensFiltradas = useMemo(() => {
    const termo = search.trim().toLowerCase()
    return ordens.filter((op) => {
      if (filtroProducao && op.status_producao !== filtroProducao) return false
      if (filtroFinanceiro && op.status_financeiro !== filtroFinanceiro) return false
      if (!termo) return true
      return (
        op.cliente.toLowerCase().includes(termo) ||
        op.nome_peca.toLowerCase().includes(termo) ||
        op.codigo.toLowerCase().includes(termo)
      )
    })
  }, [ordens, search, filtroProducao, filtroFinanceiro])

  async function handleCreate(values: NovaOrdemProducao) {
    if (!user) return
    try {
      const created = await createOrdem(values, user.id)
      toast.success(`${created.codigo} criada com sucesso`)
      setCreating(false)
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao criar OP'
      toast.error(message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card
        title="Ordens de Producao"
        subtitle="Lista de todas as OPs cadastradas"
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
            Nova OP
          </Button>
        }
      >
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">Carregando ordens...</p>
        ) : error ? (
          <p className="py-8 text-center text-sm text-red-600">{error}</p>
        ) : ordens.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Nenhuma ordem de producao cadastrada ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por cliente, peca ou codigo da OP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                className="sm:w-48"
                options={PRODUCAO_FILTER_OPTIONS}
                value={filtroProducao}
                onChange={(e) => setFiltroProducao(e.target.value as StatusProducao | '')}
              />
              <Select
                className="sm:w-48"
                options={FINANCEIRO_FILTER_OPTIONS}
                value={filtroFinanceiro}
                onChange={(e) =>
                  setFiltroFinanceiro(e.target.value as StatusFinanceiro | '')
                }
              />
            </div>

            {ordensFiltradas.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                Nenhuma OP corresponde aos filtros aplicados.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">OP</th>
                      <th className="px-3 py-2 font-medium">Cliente</th>
                      <th className="px-3 py-2 font-medium">Peca</th>
                      <th className="px-3 py-2 font-medium">Qtd.</th>
                      <th className="px-3 py-2 font-medium">Inicio</th>
                      <th className="px-3 py-2 font-medium">Termino</th>
                      <th className="px-3 py-2 font-medium">Producao</th>
                      <th className="px-3 py-2 font-medium">Financeiro</th>
                      <th className="px-3 py-2 text-right font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ordensFiltradas.map((op) => (
                      <tr
                        key={op.id}
                        onClick={() => navigate(`/ordens/${op.id}`)}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {op.codigo}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{op.cliente}</td>
                        <td className="max-w-xs truncate px-3 py-2 text-gray-700">
                          {op.nome_peca}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {op.quantidade_total} {op.unidade ?? ''}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {formatDate(op.data_inicio)}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {formatDate(op.data_termino)}
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge kind="producao" status={op.status_producao} />
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge kind="financeiro" status={op.status_financeiro} />
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {formatCurrency(op.preco_servico)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nova Ordem de Producao"
        size="lg"
      >
        <OrdemForm
          submitLabel="Criar OP"
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
        />
      </Modal>
    </div>
  )
}

export default Dashboard
