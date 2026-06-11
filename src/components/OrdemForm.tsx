import { FormEvent, ReactNode, useState } from 'react'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Select from '@/components/Select'
import Textarea from '@/components/Textarea'
import { useToast } from '@/contexts/ToastContext'
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

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h4 className="border-b border-gray-200 pb-1 text-sm font-semibold uppercase tracking-wide text-gray-600">
      {children}
    </h4>
  )
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function OrdemForm({ initial, submitLabel = 'Salvar', onSubmit, onCancel }: OrdemFormProps) {
  const toast = useToast()
  const [tipo, setTipo] = useState<TipoOP>(initial?.tipo ?? 'encomenda')
  const [dataInicio, setDataInicio] = useState(initial?.data_inicio ?? today())
  const [dataTermino, setDataTermino] = useState(initial?.data_termino ?? '')

  const [material, setMaterial] = useState(initial?.material ?? '')
  const [codigoMaterial, setCodigoMaterial] = useState(
    initial?.codigo_descricao_material ?? '',
  )
  const [quantidadeMaterial, setQuantidadeMaterial] = useState(
    initial?.quantidade_material ?? '',
  )
  const [lote, setLote] = useState(initial?.lote ?? '')
  const [fornecedor, setFornecedor] = useState(initial?.fornecedor ?? '')
  const [observacoesMaterial, setObservacoesMaterial] = useState(
    initial?.observacoes_material ?? '',
  )

  const [cliente, setCliente] = useState(initial?.cliente ?? '')
  const [cnpjCliente, setCnpjCliente] = useState(initial?.cnpj_cliente ?? '')
  const [nomePeca, setNomePeca] = useState(initial?.nome_peca ?? '')
  const [quantidadeTotal, setQuantidadeTotal] = useState(
    String(initial?.quantidade_total ?? ''),
  )
  const [unidade, setUnidade] = useState(initial?.unidade ?? '')
  const [precoServico, setPrecoServico] = useState(
    initial != null ? String(initial.preco_servico) : '',
  )
  const [precoMaterial, setPrecoMaterial] = useState(
    initial?.preco_material != null ? String(initial.preco_material) : '',
  )

  const [maquina, setMaquina] = useState(initial?.maquina_utilizada ?? '')
  const [operador, setOperador] = useState(initial?.operador_responsavel ?? '')

  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | ''>(
    initial?.forma_pagamento ?? '',
  )
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const qtd = Number(quantidadeTotal)
    if (!Number.isInteger(qtd) || qtd <= 0) {
      toast.warning('Informe uma quantidade total valida')
      return
    }

    // Preco do servico eh obrigatorio em encomendas; opcional para estoque.
    const preco = precoServico === '' ? 0 : Number(precoServico)
    if (tipo === 'encomenda' && (!Number.isFinite(preco) || preco <= 0)) {
      toast.warning('Informe o preco do servico')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        tipo,
        data_inicio: dataInicio,
        data_termino: dataTermino || null,
        material: material.trim() || null,
        codigo_descricao_material: codigoMaterial.trim() || null,
        quantidade_material: quantidadeMaterial.trim() || null,
        lote: lote.trim() || null,
        fornecedor: fornecedor.trim() || null,
        observacoes_material: observacoesMaterial.trim() || null,
        cliente: cliente.trim(),
        cnpj_cliente: cnpjCliente.trim() || null,
        nome_peca: nomePeca.trim(),
        quantidade_total: qtd,
        unidade: unidade.trim() || null,
        preco_servico: preco,
        preco_material: precoMaterial ? Number(precoMaterial) : null,
        maquina_utilizada: maquina.trim() || null,
        operador_responsavel: operador.trim() || null,
        forma_pagamento: formaPagamento || null,
        observacoes: observacoes.trim() || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form id="ordem-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
      <SectionTitle>Dados Gerais</SectionTitle>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select
          label="Tipo de OP"
          required
          options={TIPO_OPTIONS}
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoOP)}
        />
        <Input
          label="Data de inicio"
          type="date"
          required
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />
        <Input
          label="Data de termino"
          type="date"
          value={dataTermino ?? ''}
          onChange={(e) => setDataTermino(e.target.value)}
        />
      </div>

      <SectionTitle>Material</SectionTitle>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Material"
          placeholder="Ex: Aco 1045"
          value={material ?? ''}
          onChange={(e) => setMaterial(e.target.value)}
        />
        <Input
          label="Codigo / Descricao"
          value={codigoMaterial ?? ''}
          onChange={(e) => setCodigoMaterial(e.target.value)}
        />
        <Input
          label="Quantidade"
          placeholder="Ex: 5 barras, 10kg, 3 chapas"
          value={quantidadeMaterial ?? ''}
          onChange={(e) => setQuantidadeMaterial(e.target.value)}
        />
        <Input label="Lote" value={lote ?? ''} onChange={(e) => setLote(e.target.value)} />
        <Input
          label="Fornecedor"
          value={fornecedor ?? ''}
          onChange={(e) => setFornecedor(e.target.value)}
        />
        <Input
          label="Observacoes do material"
          value={observacoesMaterial ?? ''}
          onChange={(e) => setObservacoesMaterial(e.target.value)}
        />
      </div>

      <SectionTitle>Cliente e Peca</SectionTitle>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Cliente"
          required
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        />
        <Input
          label="CNPJ do cliente"
          placeholder="00.000.000/0000-00"
          value={cnpjCliente ?? ''}
          onChange={(e) => setCnpjCliente(e.target.value)}
        />
        <Input
          label="Nome da peca"
          required
          value={nomePeca}
          onChange={(e) => setNomePeca(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Quantidade total"
            type="number"
            min={1}
            required
            value={quantidadeTotal}
            onChange={(e) => setQuantidadeTotal(e.target.value)}
          />
          <Input
            label="Unidade"
            placeholder="pecas, kg, m"
            value={unidade ?? ''}
            onChange={(e) => setUnidade(e.target.value)}
          />
        </div>
        <Input
          label={`Preco do servico${tipo === 'estoque' ? ' (opcional)' : ''}`}
          type="number"
          min={0}
          step="0.01"
          leftAddon="R$"
          required={tipo === 'encomenda'}
          value={precoServico}
          onChange={(e) => setPrecoServico(e.target.value)}
        />
        <Input
          label="Preco gasto com material"
          type="number"
          min={0}
          step="0.01"
          leftAddon="R$"
          value={precoMaterial}
          onChange={(e) => setPrecoMaterial(e.target.value)}
        />
      </div>

      <SectionTitle>Producao</SectionTitle>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Maquina utilizada"
          placeholder="Ex: Torno CNC, Fresa"
          value={maquina ?? ''}
          onChange={(e) => setMaquina(e.target.value)}
        />
        <Input
          label="Operador responsavel"
          value={operador ?? ''}
          onChange={(e) => setOperador(e.target.value)}
        />
      </div>

      <SectionTitle>Financeiro e Observacoes</SectionTitle>
      <Select
        label="Forma de pagamento"
        placeholder="Selecione..."
        options={FORMA_OPTIONS}
        value={formaPagamento}
        onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
      />
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
