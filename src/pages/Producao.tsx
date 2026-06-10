import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Button from '@/components/Button'
import Card from '@/components/Card'
import DefeitosCard from '@/components/DefeitosCard'
import Input from '@/components/Input'
import ProgressBar from '@/components/ProgressBar'
import Select from '@/components/Select'
import Textarea from '@/components/Textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { listOrdens } from '@/services/ordens'
import { createRegistro, listRegistros } from '@/services/producao'
import type { OrdemProducao, RegistroProducao, Turno } from '@/types'
import { formatDate, formatOpCode, TURNO_LABEL } from '@/utils/format'

const TURNO_OPTIONS = (Object.keys(TURNO_LABEL) as Turno[]).map((value) => ({
  value,
  label: TURNO_LABEL[value],
}))

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function Producao() {
  const { user } = useAuth()
  const toast = useToast()
  const [ordens, setOrdens] = useState<OrdemProducao[]>([])
  const [registros, setRegistros] = useState<RegistroProducao[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [ordemId, setOrdemId] = useState('')
  const [data, setData] = useState(today())
  const [turno, setTurno] = useState<Turno>('manha')
  const [quantidade, setQuantidade] = useState('')
  const [defeituosas, setDefeituosas] = useState('0')
  const [observacoes, setObservacoes] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [listaOrdens, listaRegistros] = await Promise.all([
        listOrdens(),
        listRegistros(),
      ])
      setOrdens(listaOrdens)
      setRegistros(listaRegistros)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar dados'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const ordensAtivas = useMemo(
    () =>
      ordens.filter(
        (ordem) =>
          ordem.aprovada &&
          ordem.status_producao !== 'finalizada' &&
          ordem.status_producao !== 'cancelada',
      ),
    [ordens],
  )

  const ordemOptions = ordensAtivas.map((ordem) => ({
    value: ordem.id,
    label: `${formatOpCode(ordem.numero)} - ${ordem.cliente}`,
  }))

  const ordensById = useMemo(
    () => new Map(ordens.map((ordem) => [ordem.id, ordem])),
    [ordens],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || !user) return

    const qtd = Number(quantidade)
    const qtdDefeituosas = Number(defeituosas)
    if (!Number.isInteger(qtd) || qtd <= 0) {
      toast.warning('Informe uma quantidade produzida valida')
      return
    }
    if (!Number.isInteger(qtdDefeituosas) || qtdDefeituosas < 0) {
      toast.warning('Informe uma quantidade de pecas defeituosas valida')
      return
    }

    setSubmitting(true)
    try {
      await createRegistro(
        {
          ordem_producao_id: ordemId,
          data,
          turno,
          quantidade_produzida: qtd,
          pecas_defeituosas: qtdDefeituosas,
          observacoes: observacoes.trim() || null,
        },
        user.id,
      )
      toast.success('Producao registrada com sucesso')
      setQuantidade('')
      setDefeituosas('0')
      setObservacoes('')
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao registrar producao'
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
      <Card title="Registrar Producao" subtitle="Registro diario por turno">
        {ordensAtivas.length === 0 ? (
          <p className="text-sm text-gray-600">
            Nenhuma OP aprovada em andamento. Aprove uma OP no Dashboard para
            registrar producao.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Select
              label="Ordem de Producao"
              placeholder="Selecione a OP..."
              required
              options={ordemOptions}
              value={ordemId}
              onChange={(e) => setOrdemId(e.target.value)}
            />

            {ordemId && ordensById.get(ordemId) && (
              <ProgressBar
                label="Producao acumulada"
                value={ordensById.get(ordemId)!.quantidade_produzida}
                max={ordensById.get(ordemId)!.quantidade}
              />
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Data"
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
              <Select
                label="Turno"
                required
                options={TURNO_OPTIONS}
                value={turno}
                onChange={(e) => setTurno(e.target.value as Turno)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Quantidade produzida"
                type="number"
                min={1}
                required
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
              <Input
                label="Pecas defeituosas"
                type="number"
                min={0}
                required
                value={defeituosas}
                onChange={(e) => setDefeituosas(e.target.value)}
              />
            </div>

            <Textarea
              label="Observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />

            <div className="flex justify-end">
              <Button type="submit" variant="primary" loading={submitting}>
                Registrar
              </Button>
            </div>
          </form>
        )}
      </Card>

      <DefeitosCard ordens={ordensAtivas} />

      <Card title="Ultimos Registros" padding="none">
        {registros.length === 0 ? (
          <p className="p-6 text-sm text-gray-600">Nenhum registro de producao ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">OP</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Turno</th>
                  <th className="px-4 py-3 text-right">Produzidas</th>
                  <th className="px-4 py-3 text-right">Defeituosas</th>
                  <th className="px-4 py-3">Observacoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.slice(0, 15).map((registro) => {
                  const ordem = ordensById.get(registro.ordem_producao_id)
                  return (
                    <tr key={registro.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {ordem ? formatOpCode(ordem.numero) : '—'}
                      </td>
                      <td className="px-4 py-3">{formatDate(registro.data)}</td>
                      <td className="px-4 py-3">{TURNO_LABEL[registro.turno]}</td>
                      <td className="px-4 py-3 text-right">
                        {registro.quantidade_produzida}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {registro.pecas_defeituosas}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {registro.observacoes ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default Producao
