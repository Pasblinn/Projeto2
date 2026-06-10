import { useCallback, useEffect, useState } from 'react'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Modal from '@/components/Modal'
import StatusBadge from '@/components/StatusBadge'
import OrcamentoForm from '@/components/financeiro/OrcamentoForm'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import {
  createOrcamento,
  deleteOrcamento,
  listOrcamentos,
  updateOrcamento,
  updateStatusOrcamento,
} from '@/services/orcamentos'
import type { NovoOrcamento, Orcamento, StatusOrcamento } from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'

const STATUS_FLOW: Partial<Record<StatusOrcamento, StatusOrcamento[]>> = {
  rascunho: ['enviado'],
  enviado: ['aprovado', 'reprovado'],
}

const STATUS_ACTION_LABEL: Record<StatusOrcamento, string> = {
  rascunho: 'Rascunho',
  enviado: 'Marcar enviado',
  aprovado: 'Aprovar',
  reprovado: 'Reprovar',
}

function OrcamentosTab() {
  const { user } = useAuth()
  const toast = useToast()
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Orcamento | null>(null)
  const [removing, setRemoving] = useState<Orcamento | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setOrcamentos(await listOrcamentos())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar orcamentos'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(values: NovoOrcamento) {
    if (!user) return
    try {
      await createOrcamento(values, user.id)
      toast.success('Orcamento criado')
      setCreating(false)
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao criar orcamento'
      toast.error(message)
    }
  }

  async function handleEdit(values: NovoOrcamento) {
    if (!editing) return
    try {
      await updateOrcamento(editing.id, values)
      toast.success('Orcamento atualizado')
      setEditing(null)
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao atualizar orcamento'
      toast.error(message)
    }
  }

  async function handleStatus(orcamento: Orcamento, status: StatusOrcamento) {
    try {
      await updateStatusOrcamento(orcamento.id, status)
      toast.success(`${orcamento.codigo} atualizado`)
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao atualizar status'
      toast.error(message)
    }
  }

  async function handleDelete() {
    if (!removing) return
    try {
      await deleteOrcamento(removing.id)
      toast.success(`${removing.codigo} excluido`)
      setRemoving(null)
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao excluir orcamento'
      toast.error(message)
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">Carregando...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <Card
        title="Orcamentos"
        subtitle="Do rascunho a aprovacao"
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
            Novo orcamento
          </Button>
        }
        padding="none"
      >
        {orcamentos.length === 0 ? (
          <p className="p-6 text-sm text-gray-600">Nenhum orcamento cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Codigo</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Peca</th>
                  <th className="px-4 py-3 text-right">Qtd</th>
                  <th className="px-4 py-3 text-right">Valor estimado</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Criado em</th>
                  <th className="px-4 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orcamentos.map((orcamento) => (
                  <tr key={orcamento.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {orcamento.codigo}
                    </td>
                    <td className="px-4 py-3">{orcamento.cliente}</td>
                    <td className="px-4 py-3">{orcamento.peca}</td>
                    <td className="px-4 py-3 text-right">{orcamento.quantidade}</td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(orcamento.valor_estimado)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge kind="orcamento" status={orcamento.status} />
                    </td>
                    <td className="px-4 py-3">{formatDate(orcamento.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {(STATUS_FLOW[orcamento.status] ?? []).map((next) => (
                          <Button
                            key={next}
                            variant={next === 'reprovado' ? 'danger' : 'secondary'}
                            size="sm"
                            onClick={() => handleStatus(orcamento, next)}
                          >
                            {STATUS_ACTION_LABEL[next]}
                          </Button>
                        ))}
                        {!orcamento.ordem_producao_id && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditing(orcamento)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRemoving(orcamento)}
                            >
                              Excluir
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={creating} onClose={() => setCreating(false)} title="Novo orcamento">
        <OrcamentoForm
          submitLabel="Criar orcamento"
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
        />
      </Modal>

      <Modal
        open={editing != null}
        onClose={() => setEditing(null)}
        title={`Editar ${editing?.codigo ?? ''}`}
      >
        {editing && (
          <OrcamentoForm
            initial={editing}
            submitLabel="Salvar alteracoes"
            onSubmit={handleEdit}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        open={removing != null}
        onClose={() => setRemoving(null)}
        title="Excluir orcamento"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setRemoving(null)}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Excluir
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Tem certeza que deseja excluir o orcamento{' '}
          <strong>{removing?.codigo}</strong>? Essa acao nao pode ser desfeita.
        </p>
      </Modal>
    </div>
  )
}

export default OrcamentosTab
