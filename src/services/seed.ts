import { ensureSeedUsers } from '@/services/auth'
import { listRows } from '@/services/db'
import { emitirNota } from '@/services/faturamento'
import { registrarMovimento, registrarPagamento } from '@/services/financeiro'
import {
  converterEmOrdem,
  createOrcamento,
  updateStatusOrcamento,
} from '@/services/orcamentos'
import {
  aprovarOrdem,
  createOrdem,
  updateStatusProducao,
} from '@/services/ordens'
import { createDefeito, createRegistro } from '@/services/producao'

/**
 * Populates the local database with a realistic snapshot of the shop
 * floor: orders in every status, daily production logs, defects, quotes,
 * payments and invoices. Intended for evaluation/testing installs.
 */

function daysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

function daysAhead(days: number): string {
  return daysAgo(-days)
}

export async function seedDemoData(): Promise<void> {
  const [ordens, orcamentos] = await Promise.all([
    listRows('ordens_producao'),
    listRows('orcamentos'),
  ])
  if (ordens.length > 0 || orcamentos.length > 0) {
    throw new Error('O banco ja possui dados; limpe-o antes de carregar a demonstracao')
  }

  await ensureSeedUsers()
  const users = await listRows('users')
  const admin = users.find((u) => u.role === 'financeiro')
  const chefe = users.find((u) => u.role === 'chefe')
  if (!admin || !chefe) {
    throw new Error('Usuarios padrao nao encontrados')
  }

  // --- OP finalizada, paga e faturada -------------------------------------
  const opEixos = await createOrdem(
    {
      tipo: 'encomenda',
      data_inicio: daysAgo(30),
      data_termino: daysAgo(12),
      material: 'Aco 1045',
      codigo_descricao_material: 'Barra redonda 2" trefilada',
      quantidade_material: '8 barras de 3m',
      lote: 'L-2406-A',
      fornecedor: 'Acos Continente',
      cliente: 'Metalurgica Andrade',
      cnpj_cliente: '12.345.678/0001-90',
      nome_peca: 'Eixo ranhurado 320mm h7',
      quantidade_total: 120,
      unidade: 'pecas',
      preco_servico: 18600,
      preco_material: 4200,
      maquina_utilizada: 'Torno CNC Romi GL240',
      operador_responsavel: 'Carlos Mendes',
      forma_pagamento: 'boleto',
    },
    admin.id,
  )
  await aprovarOrdem(opEixos.id, 'Roberto Junqueira')
  await updateStatusProducao(opEixos.id, 'em_producao')
  const operacoesEixos: [number, string, string, string, string, number][] = [
    [28, 'Manha', '07:30', '11:45', 'Desbaste e torneamento do diametro externo (30 pecas)', 1],
    [26, 'Tarde', '13:00', '17:20', 'Abertura das ranhuras na fresadora (35 pecas)', 0],
    [21, 'Manha', '07:30', '12:00', 'Acabamento h7 e rebarbacao (30 pecas)', 2],
    [18, 'Tarde', '13:00', '16:40', 'Inspecao final e embalagem (25 pecas)', 0],
  ]
  for (const [dias, turno, inicio, fim, operacao, defeitos] of operacoesEixos) {
    await createRegistro(
      {
        ordem_producao_id: opEixos.id,
        data: daysAgo(dias),
        turno,
        hora_inicio: inicio,
        hora_fim: fim,
        descricao_operacao: operacao,
        maquina_utilizada: 'Torno CNC Romi GL240',
        pecas_defeituosas: defeitos,
      },
      chefe.id,
    )
  }
  await createDefeito(
    {
      ordem_producao_id: opEixos.id,
      data: daysAgo(21),
      quantidade: 2,
      tipo_defeito: 'Diametro fora de tolerancia',
      causa_provavel: 'Desgaste da pastilha de torneamento',
      acao_corretiva: 'Troca de pastilha e inspecao a cada 10 pecas',
    },
    chefe.id,
  )
  await updateStatusProducao(opEixos.id, 'finalizada')
  await registrarPagamento(opEixos.id, 9300, daysAgo(20), 'Entrada 50% (boleto)', admin.id)
  await registrarPagamento(opEixos.id, 9300, daysAgo(8), 'Quitacao na entrega', admin.id)
  await emitirNota(opEixos.id, 18600, daysAgo(8), 'Frete incluso', admin.id)

  // --- OP finalizada com pagamento parcial --------------------------------
  const opFlanges = await createOrdem(
    {
      tipo: 'encomenda',
      data_inicio: daysAgo(15),
      data_termino: daysAgo(5),
      material: 'Aco carbono A36',
      quantidade_material: '2 chapas 1/2"',
      fornecedor: 'Gerdau',
      cliente: 'Hidraulica Sul Equipamentos',
      cnpj_cliente: '98.765.432/0001-10',
      nome_peca: 'Flange SAE 3000 4x M12',
      quantidade_total: 60,
      unidade: 'pecas',
      preco_servico: 9450,
      preco_material: 1800,
      maquina_utilizada: 'Centro de usinagem Veker VK-850',
      operador_responsavel: 'Andre Silva',
      forma_pagamento: 'pix',
    },
    admin.id,
  )
  await aprovarOrdem(opFlanges.id, 'Roberto Junqueira')
  await updateStatusProducao(opFlanges.id, 'em_producao')
  await createRegistro(
    {
      ordem_producao_id: opFlanges.id,
      data: daysAgo(10),
      turno: 'Manha',
      hora_inicio: '08:00',
      hora_fim: '12:00',
      descricao_operacao: 'Corte e faceamento das chapas (32 pecas)',
      maquina_utilizada: 'Centro de usinagem Veker VK-850',
      pecas_defeituosas: 0,
    },
    chefe.id,
  )
  await createRegistro(
    {
      ordem_producao_id: opFlanges.id,
      data: daysAgo(7),
      turno: 'Noite',
      hora_inicio: '22:00',
      hora_fim: '04:30',
      descricao_operacao: 'Furacao 4x M12 e rosqueamento (28 pecas)',
      pecas_defeituosas: 1,
      observacoes: 'Uma peca com rosca espanada',
    },
    chefe.id,
  )
  await updateStatusProducao(opFlanges.id, 'finalizada')
  await registrarPagamento(opFlanges.id, 4725, daysAgo(6), 'Parcela 1/2 via PIX', admin.id)

  // --- OP atrasada (termino vencido, saldo em aberto) ---------------------
  const opEngrenagens = await createOrdem(
    {
      tipo: 'encomenda',
      data_inicio: daysAgo(20),
      data_termino: daysAgo(3),
      material: 'Aco 8620',
      codigo_descricao_material: 'Barra 4" laminada',
      quantidade_material: '5 barras',
      lote: 'L-2405-C',
      fornecedor: 'Villares Metals',
      observacoes_material: 'Cementar apos usinagem',
      cliente: 'Transmissoes Curitiba',
      cnpj_cliente: '45.678.912/0001-34',
      nome_peca: 'Engrenagem Z32 modulo 3',
      quantidade_total: 40,
      unidade: 'pecas',
      preco_servico: 14800,
      preco_material: 3600,
      maquina_utilizada: 'Fresadora universal Diplomat 3001',
      operador_responsavel: 'Jose Paulo',
      forma_pagamento: 'transferencia',
    },
    admin.id,
  )
  await aprovarOrdem(opEngrenagens.id, 'Marcos Tavares')
  await updateStatusProducao(opEngrenagens.id, 'em_producao')
  await createRegistro(
    {
      ordem_producao_id: opEngrenagens.id,
      data: daysAgo(9),
      turno: 'Manha',
      hora_inicio: '07:30',
      hora_fim: '11:50',
      descricao_operacao: 'Fresamento dos dentes (14 pecas)',
      maquina_utilizada: 'Fresadora universal Diplomat 3001',
      pecas_defeituosas: 2,
      observacoes: 'Maquina 3 com vibracao acima do normal',
    },
    chefe.id,
  )
  await createDefeito(
    {
      ordem_producao_id: opEngrenagens.id,
      data: daysAgo(9),
      quantidade: 2,
      tipo_defeito: 'Acabamento de dente irregular',
      causa_provavel: 'Vibracao no fresamento (rolamento da arvore)',
      acao_corretiva: 'Manutencao corretiva na maquina 3',
    },
    chefe.id,
  )
  await registrarPagamento(
    opEngrenagens.id,
    4000,
    daysAgo(15),
    'Sinal de inicio de producao',
    admin.id,
  )

  // --- OP em producao, dentro do prazo ------------------------------------
  const opBuchas = await createOrdem(
    {
      tipo: 'encomenda',
      data_inicio: daysAgo(5),
      data_termino: daysAhead(12),
      material: 'Bronze TM23',
      quantidade_material: '12 tarugos 60mm',
      fornecedor: 'Metais Sao Jose',
      cliente: 'AgroPecas Parana',
      cnpj_cliente: '23.456.789/0001-55',
      nome_peca: 'Bucha 45x55x60mm',
      quantidade_total: 200,
      unidade: 'pecas',
      preco_servico: 7200,
      preco_material: 2900,
      maquina_utilizada: 'Torno automatico Traub A42',
      operador_responsavel: 'Carlos Mendes',
      forma_pagamento: 'boleto',
    },
    chefe.id,
  )
  await aprovarOrdem(opBuchas.id, 'Roberto Junqueira')
  await updateStatusProducao(opBuchas.id, 'em_producao')
  await createRegistro(
    {
      ordem_producao_id: opBuchas.id,
      data: daysAgo(2),
      turno: 'Manha',
      hora_inicio: '07:30',
      hora_fim: '12:00',
      descricao_operacao: 'Torneamento externo e furacao (48 pecas)',
      maquina_utilizada: 'Torno automatico Traub A42',
      pecas_defeituosas: 0,
    },
    chefe.id,
  )
  await createRegistro(
    {
      ordem_producao_id: opBuchas.id,
      data: daysAgo(1),
      turno: 'Tarde',
      hora_inicio: '13:00',
      hora_fim: '17:30',
      descricao_operacao: 'Abertura do canal de lubrificacao (52 pecas)',
      pecas_defeituosas: 3,
    },
    chefe.id,
  )
  await createDefeito(
    {
      ordem_producao_id: opBuchas.id,
      data: daysAgo(1),
      quantidade: 3,
      tipo_defeito: 'Rebarba no canal de lubrificacao',
      causa_provavel: 'Avanco alto na operacao de canal',
      acao_corretiva: 'Reduzir avanco e revisar programa CNC',
    },
    chefe.id,
  )

  // --- OP pausada ----------------------------------------------------------
  const opPolias = await createOrdem(
    {
      tipo: 'estoque',
      data_inicio: daysAgo(8),
      data_termino: daysAhead(25),
      material: 'Ferro fundido GG25',
      cliente: 'Estoque interno',
      nome_peca: 'Polia em V perfil B 150mm',
      quantidade_total: 80,
      unidade: 'pecas',
      preco_servico: 5600,
      maquina_utilizada: 'Torno mecanico Nardini 350',
      observacoes: 'Pausada: prioridade para a OP da Transmissoes Curitiba',
    },
    chefe.id,
  )
  await aprovarOrdem(opPolias.id, 'Marcos Tavares')
  await updateStatusProducao(opPolias.id, 'em_producao')
  await createRegistro(
    {
      ordem_producao_id: opPolias.id,
      data: daysAgo(4),
      turno: 'Noite',
      hora_inicio: '22:00',
      hora_fim: '03:00',
      descricao_operacao: 'Desbaste do diametro externo (20 pecas)',
      pecas_defeituosas: 0,
    },
    chefe.id,
  )
  await updateStatusProducao(opPolias.id, 'pausada')

  // --- OP aprovada aguardando inicio ---------------------------------------
  const opSuportes = await createOrdem(
    {
      tipo: 'encomenda',
      data_inicio: daysAhead(3),
      data_termino: daysAhead(20),
      material: 'Ferro fundido nodular',
      fornecedor: 'Fundicao Iguatemi',
      cliente: 'Mineradora Vale do Tibagi',
      cnpj_cliente: '67.891.234/0001-78',
      nome_peca: 'Suporte mancal SNH 516',
      quantidade_total: 24,
      unidade: 'pecas',
      preco_servico: 11520,
      preco_material: 5200,
      forma_pagamento: 'boleto',
    },
    admin.id,
  )
  await aprovarOrdem(opSuportes.id, 'Roberto Junqueira')
  await registrarPagamento(opSuportes.id, 3456, daysAgo(1), 'Sinal de 30%', admin.id)

  // --- OP recem-criada, ainda nao aprovada ---------------------------------
  await createOrdem(
    {
      tipo: 'encomenda',
      data_inicio: daysAhead(7),
      data_termino: daysAhead(30),
      material: 'Aco 4140',
      cliente: 'Metalurgica Andrade',
      cnpj_cliente: '12.345.678/0001-90',
      nome_peca: 'Pino expansor 22x140mm temperado',
      quantidade_total: 150,
      unidade: 'pecas',
      preco_servico: 6750,
      forma_pagamento: 'pix',
    },
    admin.id,
  )

  // --- OP cancelada ---------------------------------------------------------
  const opCancelada = await createOrdem(
    {
      tipo: 'encomenda',
      data_inicio: daysAgo(6),
      data_termino: daysAhead(8),
      material: 'Aco D2',
      cliente: 'Ferramentaria Iguacu',
      nome_peca: 'Matriz de corte 180x120mm',
      quantidade_total: 2,
      unidade: 'pecas',
      preco_servico: 8900,
      observacoes: 'Cancelada a pedido do cliente (projeto adiado)',
    },
    admin.id,
  )
  await updateStatusProducao(opCancelada.id, 'cancelada')

  // --- Custo extra e estorno no ledger --------------------------------------
  await registrarMovimento(
    {
      ordem_producao_id: opEngrenagens.id,
      tipo: 'custo_extra',
      valor: 620,
      data: daysAgo(8),
      descricao: 'Tratamento termico terceirizado (cementacao)',
    },
    admin.id,
  )
  await registrarMovimento(
    {
      ordem_producao_id: opFlanges.id,
      tipo: 'estorno',
      valor: 300,
      data: daysAgo(3),
      descricao: 'Estorno parcial: 1 peca devolvida com defeito',
    },
    admin.id,
  )

  // --- Orcamentos em todos os status ----------------------------------------
  const orcConvertido = await createOrcamento(
    {
      cliente: 'AgroPecas Parana',
      peca: 'Cubo de roda usinado, ferro nodular',
      quantidade: 90,
      valor_estimado: 12150,
      observacoes: 'Material fornecido pelo cliente',
    },
    admin.id,
  )
  await updateStatusOrcamento(orcConvertido.id, 'enviado')
  await updateStatusOrcamento(orcConvertido.id, 'aprovado')
  await converterEmOrdem(orcConvertido.id, admin.id)

  const orcAprovado = await createOrcamento(
    {
      cliente: 'Hidraulica Sul Equipamentos',
      peca: 'Haste cromada 35mm para cilindro hidraulico',
      quantidade: 30,
      valor_estimado: 9900,
    },
    admin.id,
  )
  await updateStatusOrcamento(orcAprovado.id, 'enviado')
  await updateStatusOrcamento(orcAprovado.id, 'aprovado')

  const orcEnviado = await createOrcamento(
    {
      cliente: 'Transmissoes Curitiba',
      peca: 'Acoplamento dentado D55, aco 1045',
      quantidade: 16,
      valor_estimado: 7040,
      observacoes: 'Prazo solicitado: 15 dias',
    },
    admin.id,
  )
  await updateStatusOrcamento(orcEnviado.id, 'enviado')

  const orcReprovado = await createOrcamento(
    {
      cliente: 'Ferramentaria Iguacu',
      peca: 'Porta-pinca ER32 especial',
      quantidade: 10,
      valor_estimado: 4300,
    },
    admin.id,
  )
  await updateStatusOrcamento(orcReprovado.id, 'enviado')
  await updateStatusOrcamento(orcReprovado.id, 'reprovado')

  await createOrcamento(
    {
      cliente: 'Mineradora Vale do Tibagi',
      peca: 'Roda dentada para esteira transportadora',
      quantidade: 8,
      valor_estimado: 6400,
      observacoes: 'Aguardando desenho tecnico do cliente',
    },
    admin.id,
  )
}
