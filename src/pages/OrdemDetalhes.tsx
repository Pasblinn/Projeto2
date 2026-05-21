import { ReactNode, useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Modal from '@/components/Modal'
import OrdemForm from '@/components/OrdemForm'
import StatusBadge from '@/components/StatusBadge'
import { useToast } from '@/contexts/ToastContext'
import { getOrdem, updateOrdem } from '@/services/ordens'
import type { NovaOrdemProducao, OrdemProducao } from '@/types'
import {
  FORMA_PAGAMENTO_LABEL,
  TIPO_OP_LABEL,
  formatCurrency,
  formatDate,
  formatOpCode,
} from '@/utils/format'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{children}</dd>
    </div>
  )
}

function OrdemDetalhes() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [ordem, setOrdem] = useState<OrdemProducao | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      setOrdem(await getOrdem(id))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar a OP'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [id, toast])

  useEffect(() => {
    load()
  }, [load])

  async function handleEdit(values: NovaOrdemProducao) {
    if (!ordem) return
    try {
      const updated = await updateOrdem(ordem.id, values)
      setOrdem(updated)
      setEditing(false)
      toast.success('OP atualizada com sucesso')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao atualizar a OP'
      toast.error(message)
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">Carregando OP...</p>
  }

  if (error || !ordem) {
    return (
      <Card>
        <p className="py-4 text-center text-sm text-red-600">
          {error ?? 'Ordem nao encontrada.'}
        </p>
        <div className="text-center">
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Voltar
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">
            {formatOpCode(ordem.numero)}
          </h2>
          <StatusBadge kind="producao" status={ordem.status_producao} />
          <StatusBadge kind="financeiro" status={ordem.status_financeiro} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            Voltar
          </Button>
        </div>
      </div>

      <Card title="Dados da Ordem">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Tipo">{TIPO_OP_LABEL[ordem.tipo]}</Field>
          <Field label="Cliente">{ordem.cliente}</Field>
          <Field label="Data de entrega">{formatDate(ordem.data_entrega)}</Field>
          <Field label="Quantidade">{ordem.quantidade}</Field>
          <Field label="Produzida">{ordem.quantidade_produzida}</Field>
          <Field label="Aprovada">{ordem.aprovada ? 'Sim' : 'Nao'}</Field>
          <Field label="Valor total">{formatCurrency(ordem.valor_total)}</Field>
          <Field label="Valor pago">{formatCurrency(ordem.valor_pago)}</Field>
          <Field label="Forma de pagamento">
            {ordem.forma_pagamento ? FORMA_PAGAMENTO_LABEL[ordem.forma_pagamento] : '—'}
          </Field>
        </dl>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <Field label="Descricao">{ordem.descricao}</Field>
        </div>
        {ordem.observacoes && (
          <div className="mt-4">
            <Field label="Observacoes">{ordem.observacoes}</Field>
          </div>
        )}
      </Card>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title={`Editar ${formatOpCode(ordem.numero)}`}
      >
        <OrdemForm
          initial={ordem}
          submitLabel="Salvar alteracoes"
          onSubmit={handleEdit}
          onCancel={() => setEditing(false)}
        />
      </Modal>
    </div>
  )
}

export default OrdemDetalhes
