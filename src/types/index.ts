export type UserRole = 'financeiro' | 'chefe' | 'operador'

export interface User {
  id: string
  email: string
  nome: string
  role: UserRole
  created_at?: string
  updated_at?: string
}

export type TipoOP = 'encomenda' | 'estoque'

export type StatusProducao =
  | 'criada'
  | 'em_producao'
  | 'pausada'
  | 'finalizada'
  | 'cancelada'

export type StatusFinanceiro =
  | 'pendente'
  | 'parcial'
  | 'pago'
  | 'atrasado'
  | 'cancelado'

export type FormaPagamento =
  | 'pix'
  | 'boleto'
  | 'dinheiro'
  | 'transferencia'
  | 'cartao'
  | 'outro'

export interface OrdemProducao {
  id: string
  codigo: string
  tipo: TipoOP
  data_inicio: string
  data_termino?: string | null
  preparacao_maquina: string
  material?: string | null
  cliente: string
  peca: string
  quantidade_total: number
  preco_servico?: number | null
  maquina?: string | null
  operador?: string | null
  status_producao: StatusProducao
  status_financeiro: StatusFinanceiro
  aprovada: boolean
  aprovada_por?: string | null
  aprovada_em?: string | null
  valor_total?: number | null
  forma_pagamento?: FormaPagamento | null
  data_vencimento?: string | null
  custos_extras?: number | null
  prejuizo_defeitos?: number | null
  observacoes?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export type Turno = 'manha' | 'tarde' | 'noite'

export interface RegistroProducao {
  id: string
  ordem_producao_id: string
  data: string
  turno: Turno
  quantidade_produzida: number
  pecas_defeituosas: number
  observacoes?: string | null
  registrado_por?: string | null
  created_at: string
}

export interface RegistroDefeito {
  id: string
  ordem_producao_id: string
  data: string
  quantidade: number
  tipo_defeito: string
  causa_provavel?: string | null
  acao_corretiva?: string | null
  registrado_por?: string | null
  created_at: string
}

export type StatusOrcamento = 'rascunho' | 'enviado' | 'aprovado' | 'reprovado'

export interface Orcamento {
  id: string
  codigo: string
  cliente: string
  peca: string
  quantidade: number
  valor_estimado: number
  status: StatusOrcamento
  observacoes?: string | null
  ordem_producao_id?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export type TipoMovimento =
  | 'pagamento'
  | 'pagamento_parcial'
  | 'estorno'
  | 'ajuste'
  | 'custo_extra'

export interface MovimentoFinanceiro {
  id: string
  ordem_producao_id: string
  tipo: TipoMovimento
  valor: number
  data: string
  descricao?: string | null
  registrado_por?: string | null
  created_at: string
}

export interface FuncionarioPonto {
  id: string
  nome: string
  cargo?: string | null
  ponto_token: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export type StatusPonto = 'aberto' | 'fechado' | 'ajustado'
export type OrigemPonto = 'mobile' | 'desktop' | 'ajuste'

export interface RegistroPonto {
  id: string
  funcionario_id: string
  data: string
  hora_entrada?: string | null
  hora_saida?: string | null
  total_minutos?: number | null
  status: StatusPonto
  origem: OrigemPonto
  observacao?: string | null
  created_at: string
  updated_at: string
}
