import { FormEvent, useCallback, useEffect, useState } from 'react'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Select from '@/components/Select'
import Textarea from '@/components/Textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { createDefeito, listDefeitos } from '@/services/producao'
import type { OrdemProducao, RegistroDefeito } from '@/types'
import { formatDate, formatOpCode } from '@/utils/format'

interface DefeitosCardProps {
  ordens: OrdemProducao[]
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function DefeitosCard({ ordens }: DefeitosCardProps) {
  const { user } = useAuth()
  const toast = useToast()
  const [defeitos, setDefeitos] = useState<RegistroDefeito[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [ordemId, setOrdemId] = useState('')
  const [data, setData] = useState(today())
  const [quantidade, setQuantidade] = useState('')
  const [tipoDefeito, setTipoDefeito] = useState('')
  const [causa, setCausa] = useState('')
  const [acao, setAcao] = useState('')

  const load = useCallback(async () => {
    try {
      setDefeitos(await listDefeitos())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar defeitos'
      toast.error(message)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const ordemOptions = ordens.map((ordem) => ({
    value: ordem.id,
    label: `${formatOpCode(ordem.numero)} - ${ordem.cliente}`,
  }))

  const ordensById = new Map(ordens.map((ordem) => [ordem.id, ordem]))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || !user) return

    const qtd = Number(quantidade)
    if (!Number.isInteger(qtd) || qtd <= 0) {
      toast.warning('Informe uma quantidade de defeitos valida')
      return
    }

    setSubmitting(true)
    try {
      await createDefeito(
        {
          ordem_producao_id: ordemId,
          data,
          quantidade: qtd,
          tipo_defeito: tipoDefeito.trim(),
          causa_provavel: causa.trim() || null,
          acao_corretiva: acao.trim() || null,
        },
        user.id,
      )
      toast.success('Defeito registrado')
      setQuantidade('')
      setTipoDefeito('')
      setCausa('')
      setAcao('')
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao registrar defeito'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card
      title="Registro de Defeitos"
      subtitle="Defeitos com causa provavel e acao corretiva"
    >
      {ordens.length === 0 ? (
        <p className="text-sm text-gray-600">
          Nenhuma OP aprovada em andamento para registrar defeitos.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Ordem de Producao"
              placeholder="Selecione a OP..."
              required
              options={ordemOptions}
              value={ordemId}
              onChange={(e) => setOrdemId(e.target.value)}
            />
            <Input
              label="Data"
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Tipo de defeito"
              required
              placeholder="Ex: dimensao fora de tolerancia"
              value={tipoDefeito}
              onChange={(e) => setTipoDefeito(e.target.value)}
            />
            <Input
              label="Quantidade"
              type="number"
              min={1}
              required
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </div>

          <Textarea
            label="Causa provavel"
            value={causa}
            onChange={(e) => setCausa(e.target.value)}
          />

          <Textarea
            label="Acao corretiva"
            value={acao}
            onChange={(e) => setAcao(e.target.value)}
          />

          <div className="flex justify-end">
            <Button type="submit" variant="danger" loading={submitting}>
              Registrar defeito
            </Button>
          </div>
        </form>
      )}

      {defeitos.length > 0 && (
        <div className="mt-6 overflow-x-auto border-t border-gray-100 pt-4">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">OP</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Qtd</th>
                <th className="px-4 py-3">Causa provavel</th>
                <th className="px-4 py-3">Acao corretiva</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {defeitos.slice(0, 10).map((defeito) => {
                const ordem = ordensById.get(defeito.ordem_producao_id)
                return (
                  <tr key={defeito.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {ordem ? formatOpCode(ordem.numero) : '—'}
                    </td>
                    <td className="px-4 py-3">{formatDate(defeito.data)}</td>
                    <td className="px-4 py-3">{defeito.tipo_defeito}</td>
                    <td className="px-4 py-3 text-right">{defeito.quantidade}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {defeito.causa_provavel ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {defeito.acao_corretiva ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export default DefeitosCard
