import { ReactNode } from 'react'
import type {
  StatusFinanceiro,
  StatusOrcamento,
  StatusPonto,
  StatusProducao,
} from '@/types'

type Tone = 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'orange'

const TONE_CLASSES: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-800 border-gray-300',
  green: 'bg-green-100 text-green-800 border-green-300',
  red: 'bg-red-100 text-red-800 border-red-300',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  blue: 'bg-blue-100 text-blue-800 border-blue-300',
  purple: 'bg-purple-100 text-purple-800 border-purple-300',
  orange: 'bg-orange-100 text-orange-800 border-orange-300',
}

const PRODUCAO_MAP: Record<StatusProducao, { tone: Tone; label: string }> = {
  criada: { tone: 'blue', label: 'Criada' },
  em_producao: { tone: 'yellow', label: 'Em producao' },
  pausada: { tone: 'orange', label: 'Pausada' },
  finalizada: { tone: 'green', label: 'Finalizada' },
  cancelada: { tone: 'gray', label: 'Cancelada' },
}

const FINANCEIRO_MAP: Record<StatusFinanceiro, { tone: Tone; label: string }> = {
  pendente: { tone: 'yellow', label: 'Pendente' },
  parcial: { tone: 'blue', label: 'Parcial' },
  pago: { tone: 'green', label: 'Pago' },
  atrasado: { tone: 'red', label: 'Atrasado' },
  cancelado: { tone: 'gray', label: 'Cancelado' },
}

const ORCAMENTO_MAP: Record<StatusOrcamento, { tone: Tone; label: string }> = {
  rascunho: { tone: 'gray', label: 'Rascunho' },
  enviado: { tone: 'blue', label: 'Enviado' },
  aprovado: { tone: 'green', label: 'Aprovado' },
  reprovado: { tone: 'red', label: 'Reprovado' },
}

const PONTO_MAP: Record<StatusPonto, { tone: Tone; label: string }> = {
  aberto: { tone: 'yellow', label: 'Aberto' },
  fechado: { tone: 'green', label: 'Fechado' },
  ajustado: { tone: 'purple', label: 'Ajustado' },
}

type StatusBadgeProps =
  | { kind: 'producao'; status: StatusProducao; children?: never }
  | { kind: 'financeiro'; status: StatusFinanceiro; children?: never }
  | { kind: 'orcamento'; status: StatusOrcamento; children?: never }
  | { kind: 'ponto'; status: StatusPonto; children?: never }
  | { kind: 'custom'; tone: Tone; children: ReactNode; status?: never }

function StatusBadge(props: StatusBadgeProps) {
  let tone: Tone = 'gray'
  let label: ReactNode = ''

  switch (props.kind) {
    case 'producao':
      ({ tone, label } = PRODUCAO_MAP[props.status])
      break
    case 'financeiro':
      ({ tone, label } = FINANCEIRO_MAP[props.status])
      break
    case 'orcamento':
      ({ tone, label } = ORCAMENTO_MAP[props.status])
      break
    case 'ponto':
      ({ tone, label } = PONTO_MAP[props.status])
      break
    case 'custom':
      tone = props.tone
      label = props.children
      break
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  )
}

export default StatusBadge
