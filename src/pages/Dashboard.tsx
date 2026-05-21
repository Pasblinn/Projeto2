import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Modal from '@/components/Modal'
import OrdemForm from '@/components/OrdemForm'
import StatusBadge from '@/components/StatusBadge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { createOrdem, listOrdens } from '@/services/ordens'
import type { NovaOrdemProducao, OrdemProducao } from '@/types'
import { formatCurrency, formatDate, formatOpCode } from '@/utils/format'

function Dashboard() {
  const toast = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [ordens, setOrdens] = useState<OrdemProducao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

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

  async function handleCreate(values: NovaOrdemProducao) {
    if (!user) return
    try {
      const created = await createOrdem(values, user.id)
      toast.success(`${formatOpCode(created.numero)} criada com sucesso`)
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-medium">OP</th>
                  <th className="px-3 py-2 font-medium">Cliente</th>
                  <th className="px-3 py-2 font-medium">Descricao</th>
                  <th className="px-3 py-2 font-medium">Qtd.</th>
                  <th className="px-3 py-2 font-medium">Entrega</th>
                  <th className="px-3 py-2 font-medium">Producao</th>
                  <th className="px-3 py-2 font-medium">Financeiro</th>
                  <th className="px-3 py-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ordens.map((op) => (
                  <tr
                    key={op.id}
                    onClick={() => navigate(`/ordens/${op.id}`)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {formatOpCode(op.numero)}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{op.cliente}</td>
                    <td className="max-w-xs truncate px-3 py-2 text-gray-700">
                      {op.descricao}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {op.quantidade_produzida}/{op.quantidade}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{formatDate(op.data_entrega)}</td>
                    <td className="px-3 py-2">
                      <StatusBadge kind="producao" status={op.status_producao} />
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge kind="financeiro" status={op.status_financeiro} />
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">
                      {formatCurrency(op.valor_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nova Ordem de Producao">
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
