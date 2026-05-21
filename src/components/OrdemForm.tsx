import { FormEvent, useState } from 'react'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Select from '@/components/Select'
import Textarea from '@/components/Textarea'
import type { FormaPagamento, NovaOrdemProducao, OrdemProducao, TipoOP } from '@/types'
import { FORMA_PAGAMENTO_LABEL, TIPO_OP_LABEL } from '@/utils/format'

interface OrdemFormProps {
  initial?: OrdemProducao
  submitLabel?: string
  onSubmit: (values: NovaOrdemProducao) => Promise<void>
  onCancel: () => void
}

const TIPO_OPTIONS = (Object.keys(TIPO_OP_LABEL) as TipoOP[]).map((value) => ({
  value,
  label: TIPO_OP_LABEL[value],
}))

const FORMA_OPTIONS = (Object.keys(FORMA_PAGAMENTO_LABEL) as FormaPagamento[]).map(
  (value) => ({ value, label: FORMA_PAGAMENTO_LABEL[value] }),
)

function OrdemForm({ initial, submitLabel = 'Salvar', onSubmit, onCancel }: OrdemFormProps) {
  const [tipo, setTipo] = useState<TipoOP>(initial?.tipo ?? 'encomenda')
  const [cliente, setCliente] = useState(initial?.cliente ?? '')
  const [descricao, setDescricao] = useState(initial?.descricao ?? '')
  const [quantidade, setQuantidade] = useState(String(initial?.quantidade ?? ''))
  const [dataEntrega, setDataEntrega] = useState(initial?.data_entrega ?? '')
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | ''>(
    initial?.forma_pagamento ?? '',
  )
  const [valorTotal, setValorTotal] = useState(
    initial?.valor_total != null ? String(initial.valor_total) : '',
  )
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const qtd = Number(quantidade)
    if (!Number.isInteger(qtd) || qtd <= 0) return

    setSubmitting(true)
    try {
      await onSubmit({
        tipo,
        cliente: cliente.trim(),
        descricao: descricao.trim(),
        quantidade: qtd,
        data_entrega: dataEntrega || null,
        forma_pagamento: formaPagamento || null,
        valor_total: valorTotal ? Number(valorTotal) : null,
        observacoes: observacoes.trim() || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form id="ordem-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Tipo"
          required
          options={TIPO_OPTIONS}
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoOP)}
        />
        <Input
          label="Cliente"
          required
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        />
      </div>

      <Textarea
        label="Descricao"
        required
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />

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
          label="Data de entrega"
          type="date"
          value={dataEntrega ?? ''}
          onChange={(e) => setDataEntrega(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Forma de pagamento"
          placeholder="Selecione..."
          options={FORMA_OPTIONS}
          value={formaPagamento}
          onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
        />
        <Input
          label="Valor total"
          type="number"
          min={0}
          step="0.01"
          leftAddon="R$"
          value={valorTotal}
          onChange={(e) => setValorTotal(e.target.value)}
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

export default OrdemForm
