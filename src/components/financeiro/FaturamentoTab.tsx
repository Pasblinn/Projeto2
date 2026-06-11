import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Modal from '@/components/Modal'
import Textarea from '@/components/Textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { emitirNota, formatNotaNumero, listNotas } from '@/services/faturamento'
import { listOrdens } from '@/services/ordens'
import type { NotaFiscal, OrdemProducao } from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function FaturamentoTab() {
  const { user } = useAuth()
  const toast = useToast()
  const [ordens, setOrdens] = useState<OrdemProducao[]>([])
  const [notas, setNotas] = useState<NotaFiscal[]>([])
  const [loading, setLoading] = useState(true)
  const [emitindo, setEmitindo] = useState<OrdemProducao | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [valor, setValor] = useState('')
  const [dataEmissao, setDataEmissao] = useState(today())
  const [observacoes, setObservacoes] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [listaOrdens, listaNotas] = await Promise.all([listOrdens(), listNotas()])
      setOrdens(listaOrdens)
      setNotas(listaNotas)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar faturamento'
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

  const ordensComNota = useMemo(
    () => new Set(notas.map((nota) => nota.ordem_producao_id)),
    [notas],
  )

  const aFaturar = useMemo(
    () =>
      ordens.filter(
        (ordem) =>
          ordem.status_producao === 'finalizada' &&
          (ordem.preco_servico ?? 0) > 0 &&
          !ordensComNota.has(ordem.id),
      ),
    [ordens, ordensComNota],
  )

  function openEmissao(ordem: OrdemProducao) {
    setEmitindo(ordem)
    setValor(String(ordem.preco_servico ?? ''))
    setDataEmissao(today())
    setObservacoes('')
  }

  async function handleEmitir(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || !emitindo || !user) return

    const valorNumber = Number(valor)
    if (!Number.isFinite(valorNumber) || valorNumber <= 0) {
      toast.warning('Informe um valor valido para a nota')
      return
    }

    setSubmitting(true)
    try {
      const nota = await emitirNota(
        emitindo.id,
        valorNumber,
        dataEmissao,
        observacoes.trim() || null,
        user.id,
      )
      toast.success(`${formatNotaNumero(nota.numero)} emitida`)
      setEmitindo(null)
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao emitir nota'
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
        title="OPs a Faturar"
        subtitle="OPs finalizadas sem nota fiscal emitida"
        padding="none"
      >
        {aFaturar.length === 0 ? (
          <p className="p-6 text-sm text-gray-600">
            Nenhuma OP finalizada aguardando faturamento.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">OP</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Descricao</th>
                  <th className="px-4 py-3 text-right">Valor total</th>
                  <th className="px-4 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {aFaturar.map((ordem) => (
                  <tr key={ordem.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {ordem.codigo}
                    </td>
                    <td className="px-4 py-3">{ordem.cliente}</td>
                    <td className="px-4 py-3 text-gray-600">{ordem.nome_peca}</td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(ordem.preco_servico)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="primary" size="sm" onClick={() => openEmissao(ordem)}>
                        Emitir NF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Notas Emitidas" padding="none">
        {notas.length === 0 ? (
          <p className="p-6 text-sm text-gray-600">Nenhuma nota fiscal emitida.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Numero</th>
                  <th className="px-4 py-3">OP</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Emissao</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3">Observacoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notas.map((nota) => {
                  const ordem = ordensById.get(nota.ordem_producao_id)
                  return (
                    <tr key={nota.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatNotaNumero(nota.numero)}
                      </td>
                      <td className="px-4 py-3">
                        {ordem ? ordem.codigo : '—'}
                      </td>
                      <td className="px-4 py-3">{ordem?.cliente ?? '—'}</td>
                      <td className="px-4 py-3">{formatDate(nota.data_emissao)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(nota.valor)}</td>
                      <td className="px-4 py-3 text-gray-600">{nota.observacoes ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={emitindo != null}
        onClose={() => setEmitindo(null)}
        title={`Emitir NF - ${emitindo ? emitindo.codigo : ''}`}
        size="sm"
      >
        {emitindo && (
          <form onSubmit={handleEmitir} className="flex flex-col gap-4">
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
              label="Data de emissao"
              type="date"
              required
              value={dataEmissao}
              onChange={(e) => setDataEmissao(e.target.value)}
            />

            <Textarea
              label="Observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEmitindo(null)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Emitir nota
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default FaturamentoTab
