import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Modal from '@/components/Modal'
import StatusBadge from '@/components/StatusBadge'
import Textarea from '@/components/Textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { registrarPagamento, saldoDevedor } from '@/services/financeiro'
import { listOrdens } from '@/services/ordens'
import type { OrdemProducao } from '@/types'
import { formatCurrency, formatDate, formatOpCode } from '@/utils/format'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function ContasReceberTab() {
  const { user } = useAuth()
  const toast = useToast()
  const [ordens, setOrdens] = useState<OrdemProducao[]>([])
  const [loading, setLoading] = useState(true)
  const [pagando, setPagando] = useState<OrdemProducao | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [valor, setValor] = useState('')
  const [data, setData] = useState(today())
  const [descricao, setDescricao] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setOrdens(await listOrdens())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar OPs'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const contas = useMemo(
    () =>
      ordens.filter(
        (ordem) =>
          ordem.status_financeiro !== 'cancelado' &&
          (ordem.valor_total ?? 0) > 0 &&
          saldoDevedor(ordem) > 0,
      ),
    [ordens],
  )

  function openPagamento(ordem: OrdemProducao) {
    setPagando(ordem)
    setValor(String(saldoDevedor(ordem)))
    setData(today())
    setDescricao('')
  }

  async function handlePagamento(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || !pagando || !user) return

    const valorNumber = Number(valor)
    if (!Number.isFinite(valorNumber) || valorNumber <= 0) {
      toast.warning('Informe um valor de pagamento valido')
      return
    }

    setSubmitting(true)
    try {
      await registrarPagamento(
        pagando.id,
        valorNumber,
        data,
        descricao.trim() || null,
        user.id,
      )
      toast.success(`Pagamento registrado em ${formatOpCode(pagando.numero)}`)
      setPagando(null)
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao registrar pagamento'
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
        title="Contas a Receber"
        subtitle="OPs com saldo em aberto"
        padding="none"
      >
        {contas.length === 0 ? (
          <p className="p-6 text-sm text-gray-600">
            Nenhuma conta a receber. Todas as OPs com valor estao quitadas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">OP</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Entrega</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Valor total</th>
                  <th className="px-4 py-3 text-right">Pago</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                  <th className="px-4 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contas.map((ordem) => (
                  <tr key={ordem.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatOpCode(ordem.numero)}
                    </td>
                    <td className="px-4 py-3">{ordem.cliente}</td>
                    <td className="px-4 py-3">{formatDate(ordem.data_entrega)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge kind="financeiro" status={ordem.status_financeiro} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(ordem.valor_total)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(ordem.valor_pago)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-700">
                      {formatCurrency(saldoDevedor(ordem))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openPagamento(ordem)}
                      >
                        Registrar pagamento
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={pagando != null}
        onClose={() => setPagando(null)}
        title={`Pagamento - ${pagando ? formatOpCode(pagando.numero) : ''}`}
        size="sm"
      >
        {pagando && (
          <form onSubmit={handlePagamento} className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              Saldo em aberto:{' '}
              <strong className="text-red-700">
                {formatCurrency(saldoDevedor(pagando))}
              </strong>
            </p>

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

            <Textarea
              label="Descricao"
              placeholder="Ex: PIX recebido, parcela 1/3..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPagando(null)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Confirmar pagamento
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default ContasReceberTab
