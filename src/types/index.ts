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
  | 'transferencia'
  | 'dinheiro'
  | 'cartao'

export interface OrdemProducao {
  id: string
  numero: number
  tipo: TipoOP
  cliente: string
  descricao: string
  quantidade: number
  quantidade_produzida: number
  data_entrega?: string | null
  status_producao: StatusProducao
  status_financeiro: StatusFinanceiro
  forma_pagamento?: FormaPagamento | null
  valor_total?: number | null
  valor_pago: number
  observacoes?: string | null
  aprovada: boolean
  aprovada_por?: string | null
  aprovada_em?: string | null
  criada_por: string
  created_at: string
  updated_at: string
}

export type NovaOrdemProducao = Pick<
  OrdemProducao,
  'tipo' | 'cliente' | 'descricao' | 'quantidade'
> &
  Partial<
    Pick<
      OrdemProducao,
      'data_entrega' | 'forma_pagamento' | 'valor_total' | 'observacoes'
    >
  >

export type AtualizaOrdemProducao = Partial<NovaOrdemProducao>

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

export type NovoRegistroProducao = Pick<
  RegistroProducao,
  'ordem_producao_id' | 'data' | 'turno' | 'quantidade_produzida' | 'pecas_defeituosas'
> &
  Partial<Pick<RegistroProducao, 'observacoes'>>

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

export type NovoRegistroDefeito = Pick<
  RegistroDefeito,
  'ordem_producao_id' | 'data' | 'quantidade' | 'tipo_defeito'
> &
  Partial<Pick<RegistroDefeito, 'causa_provavel' | 'acao_corretiva'>>

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

export type NovoOrcamento = Pick<
  Orcamento,
  'cliente' | 'peca' | 'quantidade' | 'valor_estimado'
> &
  Partial<Pick<Orcamento, 'status' | 'observacoes'>>

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

export interface NotaFiscal {
  id: string
  numero: number
  ordem_producao_id: string
  valor: number
  data_emissao: string
  observacoes?: string | null
  emitida_por?: string | null
  created_at: string
}
