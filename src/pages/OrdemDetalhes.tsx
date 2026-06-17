import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Factory, ShieldCheck } from 'lucide-react'
import Button from '@/components/Button'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import Input from '@/components/Input'
import Modal from '@/components/Modal'
import OrdemForm from '@/components/OrdemForm'
import StatusBadge from '@/components/StatusBadge'
import Textarea from '@/components/Textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import {
  aprovarOrdem,
  deleteOrdem,
  getOrdem,
  setPreparacaoMaquina,
  updateOrdem,
  updateStatusProducao,
} from '@/services/ordens'
import {
  createDefeito,
  createRegistro,
  listDefeitos,
  listRegistros,
  updateRegistro,
} from '@/services/producao'
import type {
  NovaOrdemProducao,
  NovoRegistroDefeito,
  NovoRegistroProducao,
  OrdemProducao,
  RegistroDefeito,
  RegistroProducao,
  StatusProducao,
} from '@/types'
import {
  FORMA_PAGAMENTO_LABEL,
  TIPO_OP_LABEL,
  formatCurrency,
  formatDate,
} from '@/utils/format'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatTimer(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':')
}

function elapsedSince(inicio: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(inicio).getTime()) / 1000))
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}

function StatCard({ label, value, hint, tone }: {
  label: string
  value: string
  hint?: string
  tone: 'blue' | 'green' | 'red'
}) {
  const toneClass = {
    blue: 'text-primary-600',
    green: 'text-green-600',
    red: 'text-red-600',
  }[tone]

  return (
    <Card padding="sm">
      <div className="p-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className={`mt-1 text-3xl font-bold ${toneClass}`}>{value}</p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    </Card>
  )
}

interface ProducaoFormState {
  data: string
  turno: string
  hora_inicio: string
  hora_fim: string
  descricao_operacao: string
  maquina_utilizada: string
  pecas_defeituosas: string
  observacoes: string
}

const EMPTY_PRODUCAO_FORM: ProducaoFormState = {
  data: '',
  turno: '',
  hora_inicio: '',
  hora_fim: '',
  descricao_operacao: '',
  maquina_utilizada: '',
  pecas_defeituosas: '0',
  observacoes: '',
}

function OrdemDetalhes() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { user, hasRole } = useAuth()

  const [ordem, setOrdem] = useState<OrdemProducao | null>(null)
  const [registros, setRegistros] = useState<RegistroProducao[]>([])
  const [defeitos, setDefeitos] = useState<RegistroDefeito[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState(false)
  const [approving, setApproving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [supervisorNome, setSupervisorNome] = useState('')

  const [producaoModal, setProducaoModal] = useState(false)
  const [editingRegistroId, setEditingRegistroId] = useState<string | null>(null)
  const [producaoForm, setProducaoForm] = useState<ProducaoFormState>(EMPTY_PRODUCAO_FORM)

  const [defeitoModal, setDefeitoModal] = useState(false)
  const [defeitoForm, setDefeitoForm] = useState({
    data: today(),
    quantidade: '',
    tipo_defeito: '',
    causa_provavel: '',
    acao_corretiva: '',
  })

  // Dono e encarregado sao gestores (aprovam, cancelam, excluem).
  // Operador pode ver, criar, editar OP nao aprovada e registrar producao.
  const isGestor = hasRole(['encarregado', 'dono'])

  // Re-render every second while the setup timer is running so the
  // elapsed time keeps counting on screen.
  const timerRunning = ordem?.preparacao_maquina_inicio != null
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!timerRunning) return
    const interval = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(interval)
  }, [timerRunning])

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [ordemData, registrosData, defeitosData] = await Promise.all([
        getOrdem(id),
        listRegistros(id),
        listDefeitos(id),
      ])
      setOrdem(ordemData)
      setRegistros(registrosData)
      setDefeitos(defeitosData)
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

  async function handleStatus(novoStatus: StatusProducao) {
    if (!ordem) return
    try {
      setOrdem(await updateStatusProducao(ordem.id, novoStatus))
      toast.success('Status de producao atualizado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao atualizar o status')
    }
  }

  async function handleAprovar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ordem || !supervisorNome.trim()) return
    try {
      setOrdem(await aprovarOrdem(ordem.id, supervisorNome.trim()))
      setApproving(false)
      setSupervisorNome('')
      toast.success(`${ordem.codigo} aprovada`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao aprovar a OP')
    }
  }

  async function handleEdit(values: NovaOrdemProducao) {
    if (!ordem) return
    try {
      setOrdem(await updateOrdem(ordem.id, values))
      setEditing(false)
      toast.success('OP atualizada com sucesso')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao atualizar a OP')
    }
  }

  async function handleExcluir() {
    if (!ordem) return
    try {
      await deleteOrdem(ordem.id)
      toast.success(`${ordem.codigo} excluida`)
      navigate('/ordens')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao excluir a OP')
    }
  }

  async function handleTimer() {
    if (!ordem) return
    try {
      if (ordem.preparacao_maquina_inicio) {
        const total =
          ordem.preparacao_maquina_segundos + elapsedSince(ordem.preparacao_maquina_inicio)
        setOrdem(await setPreparacaoMaquina(ordem.id, total, null))
      } else {
        setOrdem(
          await setPreparacaoMaquina(
            ordem.id,
            ordem.preparacao_maquina_segundos,
            new Date().toISOString(),
          ),
        )
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao atualizar o cronometro')
    }
  }

  function openNovoRegistro() {
    setEditingRegistroId(null)
    setProducaoForm({ ...EMPTY_PRODUCAO_FORM, data: today() })
    setProducaoModal(true)
  }

  function openEditarRegistro(registro: RegistroProducao) {
    setEditingRegistroId(registro.id)
    setProducaoForm({
      data: registro.data,
      turno: registro.turno,
      hora_inicio: registro.hora_inicio ?? '',
      hora_fim: registro.hora_fim ?? '',
      descricao_operacao: registro.descricao_operacao,
      maquina_utilizada: registro.maquina_utilizada ?? '',
      pecas_defeituosas: String(registro.pecas_defeituosas),
      observacoes: registro.observacoes ?? '',
    })
    setProducaoModal(true)
  }

  async function handleSalvarProducao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ordem || !user) return

    const defeituosas = Number(producaoForm.pecas_defeituosas || '0')
    if (!Number.isInteger(defeituosas) || defeituosas < 0) {
      toast.warning('Informe um numero valido de pecas defeituosas')
      return
    }

    const payload: NovoRegistroProducao = {
      ordem_producao_id: ordem.id,
      data: producaoForm.data,
      turno: producaoForm.turno.trim(),
      hora_inicio: producaoForm.hora_inicio || null,
      hora_fim: producaoForm.hora_fim || null,
      descricao_operacao: producaoForm.descricao_operacao.trim(),
      maquina_utilizada: producaoForm.maquina_utilizada.trim() || null,
      pecas_defeituosas: defeituosas,
      observacoes: producaoForm.observacoes.trim() || null,
    }

    try {
      if (editingRegistroId) {
        await updateRegistro(editingRegistroId, payload)
        toast.success('Registro de producao atualizado')
      } else {
        await createRegistro(payload, user.id)
        toast.success('Producao registrada')
      }
      setProducaoModal(false)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao salvar producao')
    }
  }

  async function handleSalvarDefeito(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ordem || !user) return

    const qtd = Number(defeitoForm.quantidade)
    if (!Number.isInteger(qtd) || qtd <= 0) {
      toast.warning('Informe uma quantidade de defeitos valida')
      return
    }

    const payload: NovoRegistroDefeito = {
      ordem_producao_id: ordem.id,
      data: defeitoForm.data,
      quantidade: qtd,
      tipo_defeito: defeitoForm.tipo_defeito.trim(),
      causa_provavel: defeitoForm.causa_provavel.trim() || null,
      acao_corretiva: defeitoForm.acao_corretiva.trim() || null,
    }

    try {
      await createDefeito(payload, user.id)
      toast.success('Defeito registrado')
      setDefeitoModal(false)
      setDefeitoForm({
        data: today(),
        quantidade: '',
        tipo_defeito: '',
        causa_provavel: '',
        acao_corretiva: '',
      })
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao registrar defeito')
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
          <Button variant="secondary" onClick={() => navigate('/ordens')}>
            Voltar
          </Button>
        </div>
      </Card>
    )
  }

  const totalDefeitos =
    defeitos.reduce((sum, d) => sum + d.quantidade, 0) +
    registros.reduce((sum, r) => sum + r.pecas_defeituosas, 0)
  const ativa =
    ordem.status_producao !== 'finalizada' && ordem.status_producao !== 'cancelada'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/ordens')}>
            Voltar
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{ordem.codigo}</h2>
            <p className="text-sm text-gray-600">
              {ordem.cliente} - {ordem.nome_peca}
            </p>
          </div>
          <StatusBadge kind="producao" status={ordem.status_producao} />
          <StatusBadge kind="financeiro" status={ordem.status_financeiro} />
        </div>

        <div className="flex flex-wrap gap-2">
          {ordem.status_producao === 'criada' && (
            <Button variant="primary" size="sm" onClick={() => handleStatus('em_producao')}>
              Iniciar
            </Button>
          )}
          {ordem.status_producao === 'em_producao' && (
            <>
              <Button variant="secondary" size="sm" onClick={() => handleStatus('pausada')}>
                Pausar
              </Button>
              <Button variant="success" size="sm" onClick={() => handleStatus('finalizada')}>
                Finalizar
              </Button>
            </>
          )}
          {ordem.status_producao === 'pausada' && (
            <Button variant="primary" size="sm" onClick={() => handleStatus('em_producao')}>
              Retomar
            </Button>
          )}
          {ativa && isGestor && (
            <Button variant="danger" size="sm" onClick={() => handleStatus('cancelada')}>
              Cancelar
            </Button>
          )}
          {!ordem.aprovada && (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              Editar
            </Button>
          )}
          {isGestor && !ordem.aprovada && (
            <Button variant="success" size="sm" onClick={() => setApproving(true)}>
              Aprovar
            </Button>
          )}
          {isGestor && (
            <Button variant="danger" size="sm" onClick={() => setRemoving(true)}>
              Excluir
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Quantidade Total"
          value={String(ordem.quantidade_total)}
          hint={ordem.unidade ?? 'unid.'}
          tone="blue"
        />
        <StatCard
          label="Operacoes"
          value={String(registros.length)}
          hint="registradas"
          tone="green"
        />
        <StatCard label="Defeitos" value={String(totalDefeitos)} tone="red" />
      </div>

      {ordem.aprovada && (
        <Card className="border-green-300 bg-green-50">
          <p className="font-semibold text-green-900">OP Aprovada</p>
          <p className="text-sm text-green-700">
            Aprovada por {ordem.supervisor_nome} em{' '}
            {formatDate(ordem.supervisor_data_aprovacao)}
          </p>
        </Card>
      )}

      <Card title="Informacoes da OP">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
          <InfoItem label="Tipo" value={TIPO_OP_LABEL[ordem.tipo]} />
          <InfoItem label="Data de inicio" value={formatDate(ordem.data_inicio)} />
          <InfoItem label="Data de termino" value={formatDate(ordem.data_termino)} />
          <InfoItem label="Cliente" value={ordem.cliente} />
          <InfoItem label="CNPJ do cliente" value={ordem.cnpj_cliente} />
          <InfoItem label="Peca" value={ordem.nome_peca} />
          <InfoItem
            label="Quantidade total"
            value={`${ordem.quantidade_total} ${ordem.unidade ?? 'unid.'}`}
          />
          <InfoItem
            label="Preco do servico"
            value={formatCurrency(ordem.preco_servico)}
          />
          <InfoItem
            label="Preco do material"
            value={
              ordem.preco_material != null && ordem.preco_material > 0
                ? formatCurrency(ordem.preco_material)
                : null
            }
          />
          <InfoItem label="Valor pago" value={formatCurrency(ordem.valor_pago)} />
          <InfoItem
            label="Forma de pagamento"
            value={ordem.forma_pagamento ? FORMA_PAGAMENTO_LABEL[ordem.forma_pagamento] : null}
          />
          <InfoItem label="Maquina" value={ordem.maquina_utilizada} />
          <InfoItem label="Operador responsavel" value={ordem.operador_responsavel} />
          <InfoItem label="Material" value={ordem.material} />
          <InfoItem
            label="Codigo / Descricao"
            value={ordem.codigo_descricao_material}
          />
          <InfoItem label="Qtd. material" value={ordem.quantidade_material} />
          <InfoItem label="Lote" value={ordem.lote} />
          <InfoItem label="Fornecedor" value={ordem.fornecedor} />
        </div>
        {ordem.observacoes_material && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <InfoItem label="Obs. material" value={ordem.observacoes_material} />
          </div>
        )}
        {ordem.observacoes && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <InfoItem label="Observacoes" value={ordem.observacoes} />
          </div>
        )}
      </Card>

      <Card title="Preparacao da Maquina">
        <div className="flex flex-wrap items-center gap-6 rounded-lg border-2 border-gray-200 bg-gray-50 p-6">
          <p
            className={`font-mono text-4xl font-bold tabular-nums ${
              timerRunning ? 'text-green-600' : 'text-gray-800'
            }`}
          >
            {formatTimer(
              ordem.preparacao_maquina_segundos +
                (ordem.preparacao_maquina_inicio
                  ? elapsedSince(ordem.preparacao_maquina_inicio)
                  : 0),
            )}
          </p>
          <Button
            variant={timerRunning ? 'danger' : 'success'}
            size="sm"
            onClick={handleTimer}
          >
            {timerRunning ? 'Pausar' : 'Iniciar'}
          </Button>
          {timerRunning ? (
            <span className="flex items-center gap-2 text-sm font-semibold text-green-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              Em andamento
            </span>
          ) : (
            ordem.preparacao_maquina_segundos > 0 && (
              <span className="text-sm text-gray-500">Tempo acumulado</span>
            )
          )}
        </div>
      </Card>

      <Card
        title="Producao Diaria"
        actions={
          <Button variant="primary" size="sm" onClick={openNovoRegistro}>
            Registrar Producao
          </Button>
        }
        padding="none"
      >
        {registros.length === 0 ? (
          <EmptyState
            compact
            icon={Factory}
            title="Nenhuma producao registrada"
            description="Use 'Registrar Producao' para lancar as operacoes do dia."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Turno</th>
                  <th className="px-4 py-3">Horario</th>
                  <th className="px-4 py-3">Maquina</th>
                  <th className="px-4 py-3">Operacao Realizada</th>
                  <th className="px-4 py-3 text-right">Defeitos</th>
                  <th className="px-4 py-3 text-center">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.map((registro) => (
                  <tr key={registro.id}>
                    <td className="px-4 py-3">{formatDate(registro.data)}</td>
                    <td className="px-4 py-3">{registro.turno}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {registro.hora_inicio && registro.hora_fim
                        ? `${registro.hora_inicio} - ${registro.hora_fim}`
                        : (registro.hora_inicio ?? registro.hora_fim ?? '—')}
                    </td>
                    <td className="px-4 py-3">{registro.maquina_utilizada ?? '—'}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {registro.descricao_operacao}
                      </p>
                      {registro.observacoes && (
                        <p className="mt-1 text-xs text-gray-500">{registro.observacoes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      {registro.pecas_defeituosas}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditarRegistro(registro)}
                      >
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="Pecas Defeituosas"
        actions={
          <Button variant="danger" size="sm" onClick={() => setDefeitoModal(true)}>
            Registrar Defeito
          </Button>
        }
      >
        {defeitos.length === 0 ? (
          <EmptyState
            compact
            icon={ShieldCheck}
            title="Nenhum defeito registrado"
            description="Otimo sinal — registre aqui se aparecer alguma peca fora de conformidade."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {defeitos.map((defeito) => (
              <div
                key={defeito.id}
                className="rounded-lg border-2 border-red-200 bg-red-50 p-4"
              >
                <p className="font-bold text-red-900">
                  {defeito.quantidade} peca(s) - {formatDate(defeito.data)}
                </p>
                <div className="mt-2 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <p className="font-semibold text-red-800">Tipo de defeito:</p>
                    <p className="text-red-900">{defeito.tipo_defeito}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-red-800">Causa provavel:</p>
                    <p className="text-red-900">{defeito.causa_provavel ?? '—'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-red-800">Acao corretiva:</p>
                    <p className="text-red-900">{defeito.acao_corretiva ?? '—'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title={`Editar ${ordem.codigo}`}
        size="lg"
      >
        <OrdemForm
          initial={ordem}
          submitLabel="Salvar alteracoes"
          onSubmit={handleEdit}
          onCancel={() => setEditing(false)}
        />
      </Modal>

      <Modal
        open={approving}
        onClose={() => setApproving(false)}
        title="Aprovar Ordem de Producao"
        size="sm"
      >
        <form onSubmit={handleAprovar} className="flex flex-col gap-4">
          <p className="text-sm text-gray-700">
            Apos a aprovacao, os dados da OP nao poderao ser alterados.
          </p>
          <Input
            label="Nome do supervisor"
            required
            value={supervisorNome}
            onChange={(e) => setSupervisorNome(e.target.value)}
          />
          <Button type="submit" variant="success" fullWidth>
            Aprovar OP
          </Button>
        </form>
      </Modal>

      <Modal
        open={removing}
        onClose={() => setRemoving(false)}
        title="Confirmar Exclusao"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setRemoving(false)}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" onClick={handleExcluir}>
              Excluir OP
            </Button>
          </>
        }
      >
        <p className="text-sm text-red-800">
          Tem certeza que deseja excluir a OP <strong>{ordem.codigo}</strong>? Todos os
          registros de producao, defeitos e movimentos financeiros associados serao
          excluidos. Essa acao nao pode ser desfeita.
        </p>
      </Modal>

      <Modal
        open={producaoModal}
        onClose={() => setProducaoModal(false)}
        title={editingRegistroId ? 'Editar Producao' : 'Registrar Producao'}
      >
        <form onSubmit={handleSalvarProducao} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Data"
              type="date"
              required
              value={producaoForm.data}
              onChange={(e) => setProducaoForm({ ...producaoForm, data: e.target.value })}
            />
            <Input
              label="Turno"
              placeholder="Ex: Manha, Tarde, Noite"
              required
              value={producaoForm.turno}
              onChange={(e) => setProducaoForm({ ...producaoForm, turno: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hora inicio"
              type="time"
              value={producaoForm.hora_inicio}
              onChange={(e) =>
                setProducaoForm({ ...producaoForm, hora_inicio: e.target.value })
              }
            />
            <Input
              label="Hora fim"
              type="time"
              value={producaoForm.hora_fim}
              onChange={(e) =>
                setProducaoForm({ ...producaoForm, hora_fim: e.target.value })
              }
            />
          </div>
          <Textarea
            label="Descricao da operacao"
            required
            placeholder="Ex: Fiz 50 pecas lado direito (2 furos) / Virei as pecas e fiz o lado esquerdo"
            value={producaoForm.descricao_operacao}
            onChange={(e) =>
              setProducaoForm({ ...producaoForm, descricao_operacao: e.target.value })
            }
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Maquina utilizada"
              placeholder="Ex: Torno CNC, Fresa"
              value={producaoForm.maquina_utilizada}
              onChange={(e) =>
                setProducaoForm({ ...producaoForm, maquina_utilizada: e.target.value })
              }
            />
            <Input
              label="Pecas defeituosas"
              type="number"
              min={0}
              value={producaoForm.pecas_defeituosas}
              onChange={(e) =>
                setProducaoForm({ ...producaoForm, pecas_defeituosas: e.target.value })
              }
            />
          </div>
          <Textarea
            label="Observacoes"
            value={producaoForm.observacoes}
            onChange={(e) =>
              setProducaoForm({ ...producaoForm, observacoes: e.target.value })
            }
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setProducaoModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editingRegistroId ? 'Salvar alteracoes' : 'Registrar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={defeitoModal}
        onClose={() => setDefeitoModal(false)}
        title="Registrar Defeito"
      >
        <form onSubmit={handleSalvarDefeito} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Data"
              type="date"
              required
              value={defeitoForm.data}
              onChange={(e) => setDefeitoForm({ ...defeitoForm, data: e.target.value })}
            />
            <Input
              label="Quantidade"
              type="number"
              min={1}
              required
              value={defeitoForm.quantidade}
              onChange={(e) =>
                setDefeitoForm({ ...defeitoForm, quantidade: e.target.value })
              }
            />
          </div>
          <Input
            label="Tipo de defeito"
            required
            placeholder="Ex: dimensao fora de tolerancia"
            value={defeitoForm.tipo_defeito}
            onChange={(e) =>
              setDefeitoForm({ ...defeitoForm, tipo_defeito: e.target.value })
            }
          />
          <Textarea
            label="Causa provavel"
            value={defeitoForm.causa_provavel}
            onChange={(e) =>
              setDefeitoForm({ ...defeitoForm, causa_provavel: e.target.value })
            }
          />
          <Textarea
            label="Acao corretiva"
            value={defeitoForm.acao_corretiva}
            onChange={(e) =>
              setDefeitoForm({ ...defeitoForm, acao_corretiva: e.target.value })
            }
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setDefeitoModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="danger">
              Registrar defeito
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default OrdemDetalhes
