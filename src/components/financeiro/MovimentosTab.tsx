import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Modal from '@/components/Modal'
import Select from '@/components/Select'
import StatusBadge from '@/components/StatusBadge'
import Textarea from '@/components/Textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { listMovimentos, registrarMovimento } from '@/services/financeiro'
import { listOrdens } from '@/services/ordens'
import type { MovimentoFinanceiro, OrdemProducao, TipoMovimento } from '@/types'
import {
  formatCurrency,
  formatDate,
  TIPO_MOVIMENTO_LABEL,
} from '@/utils/format'

const TIPO_MOVIMENTO_TONE: Record<TipoMovimento, 'green' | 'blue' | 'red' | 'gray' | 'orange'> = {
  pagamento: 'green',
  pagamento_parcial: 'blue',
  estorno: 'red',
  ajuste: 'gray',
  custo_extra: 'orange',
}

const TIPO_MANUAL_OPTIONS = (['ajuste', 'estorno', 'custo_extra'] as TipoMovimento[]).map(
  (value) => ({ value, label: TIPO_MOVIMENTO_LABEL[value] }),
)

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function MovimentosTab() {
  const { user } = useAuth()
  const toast = useToast()
  const [movimentos, setMovimentos] = useState<MovimentoFinanceiro[]>([])
  const [ordens, setOrdens] = useState<OrdemProducao[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroOrdem, setFiltroOrdem] = useState('')
  const [criando, setCriando] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [ordemId, setOrdemId] = useState('')
  const [tipo, setTipo] = useState<TipoMovimento>('ajuste')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(today())
  const [descricao, setDescricao] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [listaMovimentos, listaOrdens] = await Promise.all([
        listMovimentos(),
        listOrdens(),
      ])
      setMovimentos(listaMovimentos)
      setOrdens(listaOrdens)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar movimentos'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const ordensById = useMemo(
    () => new Map(ordens.map((ordem) => [ordem.id, ordem])),
    [ordens],
  )

  const ordemOptions = ordens.map((ordem) => ({
    value: ordem.id,
    label: `${ordem.codigo} - ${ordem.cliente}`,
  }))

  const visiveis = useMemo(
    () =>
      movimentos.filter(
        (movimento) => !filtroOrdem || movimento.ordem_producao_id === filtroOrdem,
      ),
    [movimentos, filtroOrdem],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || !user) return

    const valorNumber = Number(valor)
    if (!Number.isFinite(valorNumber) || valorNumber <= 0) {
      toast.warning('Informe um valor valido')
      return
    }

    setSubmitting(true)
    try {
      await registrarMovimento(
        {
          ordem_producao_id: ordemId,
          tipo,
          valor: valorNumber,
          data,
          descricao: descricao.trim() || null,
        },
        user.id,
      )
      toast.success('Movimento registrado')
      setCriando(false)
      setValor('')
      setDescricao('')
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao registrar movimento'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">Carregando...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <Card
        title="OPs e Financeiro"
        subtitle="Historico de movimentos financeiros (ledger)"
        actions={
          <Button variant="primary" size="sm" onClick={() => setCriando(true)}>
            Novo movimento
          </Button>
        }
        padding="none"
      >
        <div className="border-b border-gray-100 p-4">
          <div className="max-w-sm">
            <Select
              label="Filtrar por OP"
              options={[{ value: '', label: 'Todas as OPs' }, ...ordemOptions]}
              value={filtroOrdem}
              onChange={(e) => setFiltroOrdem(e.target.value)}
            />
          </div>
        </div>

        {visiveis.length === 0 ? (
          <p className="p-6 text-sm text-gray-600">Nenhum movimento registrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">OP</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3">Descricao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visiveis.map((movimento) => {
                  const ordem = ordensById.get(movimento.ordem_producao_id)
                  return (
                    <tr key={movimento.id}>
                      <td className="px-4 py-3">{formatDate(movimento.data)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {ordem ? ordem.codigo : '—'}
                      </td>
                      <td className="px-4 py-3">{ordem?.cliente ?? '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge kind="custom" tone={TIPO_MOVIMENTO_TONE[movimento.tipo]}>
                          {TIPO_MOVIMENTO_LABEL[movimento.tipo]}
                        </StatusBadge>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold ${
                          movimento.tipo === 'estorno' ? 'text-red-700' : 'text-green-700'
                        }`}
                      >
                        {movimento.tipo === 'estorno' ? '-' : ''}
                        {formatCurrency(movimento.valor)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {movimento.descricao ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={criando}
        onClose={() => setCriando(false)}
        title="Novo movimento financeiro"
        size="sm"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select
            label="Ordem de Producao"
            placeholder="Selecione a OP..."
            required
            options={ordemOptions}
            value={ordemId}
            onChange={(e) => setOrdemId(e.target.value)}
          />

          <Select
            label="Tipo"
            required
            options={TIPO_MANUAL_OPTIONS}
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoMovimento)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Valor"
              type="number"
              min={0.01}
              step="0.01"
              leftAddon="R$"
              required
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
            <Input
              label="Data"
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <Textarea
            label="Descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCriando(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Registrar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default MovimentosTab
