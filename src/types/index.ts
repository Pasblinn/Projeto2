export type UserRole = 'dono' | 'encarregado' | 'operador'

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
  codigo: string
  tipo: TipoOP
  data_inicio: string
  data_termino?: string | null
  status_producao: StatusProducao
  status_financeiro: StatusFinanceiro

  // Material
  material?: string | null
  codigo_descricao_material?: string | null
  quantidade_material?: string | null
  lote?: string | null
  fornecedor?: string | null
  observacoes_material?: string | null

  // Cliente e peca
  cliente: string
  cnpj_cliente?: string | null
  nome_peca: string
  quantidade_total: number
  unidade?: string | null
  preco_servico: number
  preco_material?: number | null

  // Producao
  maquina_utilizada?: string | null
  operador_responsavel?: string | null
  preparacao_maquina_segundos: number
  preparacao_maquina_inicio?: string | null

  // Aprovacao do supervisor
  aprovada: boolean
  supervisor_nome?: string | null
  supervisor_data_aprovacao?: string | null

  // Financeiro
  forma_pagamento?: FormaPagamento | null
  valor_pago: number

  observacoes?: string | null
  criada_por: string
  created_at: string
  updated_at: string
}

export type NovaOrdemProducao = Pick<
  OrdemProducao,
  'tipo' | 'data_inicio' | 'cliente' | 'nome_peca' | 'quantidade_total' | 'preco_servico'
> &
  Partial<
    Pick<
      OrdemProducao,
      | 'data_termino'
      | 'material'
      | 'codigo_descricao_material'
      | 'quantidade_material'
      | 'lote'
      | 'fornecedor'
      | 'observacoes_material'
      | 'cnpj_cliente'
      | 'unidade'
      | 'preco_material'
      | 'maquina_utilizada'
      | 'operador_responsavel'
      | 'forma_pagamento'
      | 'observacoes'
    >
  >

export type AtualizaOrdemProducao = Partial<NovaOrdemProducao>

export interface RegistroProducao {
  id: string
  ordem_producao_id: string
  data: string
  turno: string
  hora_inicio?: string | null
  hora_fim?: string | null
  descricao_operacao: string
  maquina_utilizada?: string | null
  pecas_defeituosas: number
  observacoes?: string | null
  registrado_por?: string | null
  created_at: string
}

export type NovoRegistroProducao = Pick<
  RegistroProducao,
  'ordem_producao_id' | 'data' | 'turno' | 'descricao_operacao' | 'pecas_defeituosas'
> &
  Partial<
    Pick<RegistroProducao, 'hora_inicio' | 'hora_fim' | 'maquina_utilizada' | 'observacoes'>
  >

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
