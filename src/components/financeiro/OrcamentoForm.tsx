import { FormEvent, useState } from 'react'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import { useToast } from '@/contexts/ToastContext'
import type { NovoOrcamento, Orcamento } from '@/types'

interface OrcamentoFormProps {
  initial?: Orcamento
  submitLabel?: string
  onSubmit: (values: NovoOrcamento) => Promise<void>
  onCancel: () => void
}

function OrcamentoForm({
  initial,
  submitLabel = 'Salvar',
  onSubmit,
  onCancel,
}: OrcamentoFormProps) {
  const toast = useToast()
  const [cliente, setCliente] = useState(initial?.cliente ?? '')
  const [peca, setPeca] = useState(initial?.peca ?? '')
  const [quantidade, setQuantidade] = useState(String(initial?.quantidade ?? ''))
  const [valorEstimado, setValorEstimado] = useState(
    initial?.valor_estimado != null ? String(initial.valor_estimado) : '',
  )
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const qtd = Number(quantidade)
    const valor = Number(valorEstimado)
    if (!Number.isInteger(qtd) || qtd <= 0) {
      toast.warning('Informe uma quantidade valida')
      return
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      toast.warning('Informe um valor estimado valido')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        cliente: cliente.trim(),
        peca: peca.trim(),
        quantidade: qtd,
        valor_estimado: valor,
        observacoes: observacoes.trim() || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Cliente"
          required
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        />
        <Input
          label="Peca"
          required
          value={peca}
          onChange={(e) => setPeca(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Quantidade"
          type="number"
          min={1}
          required
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
        />
        <Input
          label="Valor estimado"
          type="number"
          min={0}
          step="0.01"
          leftAddon="R$"
          required
          value={valorEstimado}
          onChange={(e) => setValorEstimado(e.target.value)}
        />
      </div>

      <Textarea
        label="Observacoes"
        value={observacoes ?? ''}
        onChange={(e) => setObservacoes(e.target.value)}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

export default OrcamentoForm
