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
  updateOrdem,
  updateStatusProducao,
} from '@/services/ordens'
import { createDefeito, createRegistro } from '@/services/producao'
import type { Turno } from '@/types'

/**
 * Populates the local database with a realistic snapshot of the shop
 * floor: orders in every status, production logs, defects, quotes,
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
  if (listRows('ordens_producao').length > 0 || listRows('orcamentos').length > 0) {
    throw new Error('O banco ja possui dados; limpe-o antes de carregar a demonstracao')
  }

  await ensureSeedUsers()
  const users = listRows('users')
  const admin = users.find((u) => u.role === 'financeiro')
  const chefe = users.find((u) => u.role === 'chefe')
  if (!admin || !chefe) {
    throw new Error('Usuarios padrao nao encontrados')
  }

  // --- OP finalizada, paga e faturada -------------------------------------
  const opEixos = await createOrdem(
    {
      tipo: 'encomenda',
      cliente: 'Metalurgica Andrade',
      descricao: 'Eixo ranhurado aco 1045, 320mm, tolerancia h7',
      quantidade: 120,
      data_entrega: daysAgo(12),
      forma_pagamento: 'boleto',
      valor_total: 18600,
    },
    admin.id,
  )
  await aprovarOrdem(opEixos.id, admin.id)
  await updateStatusProducao(opEixos.id, 'em_producao')
  const turnosEixos: [number, Turno, number, number][] = [
    [28, 'manha', 30, 1],
    [26, 'tarde', 35, 0],
    [21, 'manha', 30, 2],
    [18, 'tarde', 25, 0],
  ]
  for (const [dias, turno, qtd, defeitos] of turnosEixos) {
    await createRegistro(
      {
        ordem_producao_id: opEixos.id,
        data: daysAgo(dias),
        turno,
        quantidade_produzida: qtd,
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
      cliente: 'Hidraulica Sul Equipamentos',
      descricao: 'Flange SAE 3000 em aco carbono, furacao 4x M12',
      quantidade: 60,
      data_entrega: daysAgo(5),
      forma_pagamento: 'pix',
      valor_total: 9450,
    },
    admin.id,
  )
  await aprovarOrdem(opFlanges.id, chefe.id)
  await updateStatusProducao(opFlanges.id, 'em_producao')
  await createRegistro(
    {
      ordem_producao_id: opFlanges.id,
      data: daysAgo(10),
      turno: 'manha',
      quantidade_produzida: 32,
      pecas_defeituosas: 0,
    },
    chefe.id,
  )
  await createRegistro(
    {
      ordem_producao_id: opFlanges.id,
      data: daysAgo(7),
      turno: 'noite',
      quantidade_produzida: 28,
      pecas_defeituosas: 1,
    },
    chefe.id,
  )
  await updateStatusProducao(opFlanges.id, 'finalizada')
  await registrarPagamento(opFlanges.id, 4725, daysAgo(6), 'Parcela 1/2 via PIX', admin.id)

  // --- OP atrasada (entrega vencida, saldo em aberto) ---------------------
  const opEngrenagens = await createOrdem(
    {
      tipo: 'encomenda',
      cliente: 'Transmissoes Curitiba',
      descricao: 'Engrenagem cilindrica Z32 modulo 3, aco 8620 cementado',
      quantidade: 40,
      data_entrega: daysAgo(3),
      forma_pagamento: 'transferencia',
      valor_total: 14800,
    },
    admin.id,
  )
  await aprovarOrdem(opEngrenagens.id, admin.id)
  await updateStatusProducao(opEngrenagens.id, 'em_producao')
  await createRegistro(
    {
      ordem_producao_id: opEngrenagens.id,
      data: daysAgo(9),
      turno: 'manha',
      quantidade_produzida: 14,
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
      cliente: 'AgroPecas Parana',
      descricao: 'Bucha de bronze TM23, 45x55x60mm',
      quantidade: 200,
      data_entrega: daysAhead(12),
      forma_pagamento: 'boleto',
      valor_total: 7200,
    },
    chefe.id,
  )
  await aprovarOrdem(opBuchas.id, admin.id)
  await updateStatusProducao(opBuchas.id, 'em_producao')
  await createRegistro(
    {
      ordem_producao_id: opBuchas.id,
      data: daysAgo(2),
      turno: 'manha',
      quantidade_produzida: 48,
      pecas_defeituosas: 0,
    },
    chefe.id,
  )
  await createRegistro(
    {
      ordem_producao_id: opBuchas.id,
      data: daysAgo(1),
      turno: 'tarde',
      quantidade_produzida: 52,
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
      cliente: 'Estoque interno',
      descricao: 'Polia em V perfil B, 2 canais, 150mm',
      quantidade: 80,
      data_entrega: daysAhead(25),
      valor_total: 5600,
    },
    chefe.id,
  )
  await aprovarOrdem(opPolias.id, chefe.id)
  await updateStatusProducao(opPolias.id, 'em_producao')
  await createRegistro(
    {
      ordem_producao_id: opPolias.id,
      data: daysAgo(4),
      turno: 'noite',
      quantidade_produzida: 20,
      pecas_defeituosas: 0,
    },
    chefe.id,
  )
  await updateStatusProducao(opPolias.id, 'pausada')
  await updateOrdem(opPolias.id, {
    observacoes: 'Pausada: prioridade para a OP da Transmissoes Curitiba',
  })

  // --- OP aprovada aguardando inicio ---------------------------------------
  const opSuportes = await createOrdem(
    {
      tipo: 'encomenda',
      cliente: 'Mineradora Vale do Tibagi',
      descricao: 'Suporte usinado para mancal SNH 516, ferro fundido',
      quantidade: 24,
      data_entrega: daysAhead(20),
      forma_pagamento: 'boleto',
      valor_total: 11520,
    },
    admin.id,
  )
  await aprovarOrdem(opSuportes.id, admin.id)
  await registrarPagamento(opSuportes.id, 3456, daysAgo(1), 'Sinal de 30%', admin.id)

  // --- OP recem-criada, ainda nao aprovada ---------------------------------
  await createOrdem(
    {
      tipo: 'encomenda',
      cliente: 'Metalurgica Andrade',
      descricao: 'Pino expansor 22x140mm, aco 4140 temperado',
      quantidade: 150,
      data_entrega: daysAhead(30),
      forma_pagamento: 'pix',
      valor_total: 6750,
    },
    admin.id,
  )

  // --- OP cancelada ---------------------------------------------------------
  const opCancelada = await createOrdem(
    {
      tipo: 'encomenda',
      cliente: 'Ferramentaria Iguacu',
      descricao: 'Matriz de corte 180x120mm, aco D2',
      quantidade: 2,
      data_entrega: daysAhead(8),
      valor_total: 8900,
    },
    admin.id,
  )
  await updateStatusProducao(opCancelada.id, 'cancelada')
  await updateOrdem(opCancelada.id, {
    observacoes: 'Cancelada a pedido do cliente (projeto adiado)',
  })

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
