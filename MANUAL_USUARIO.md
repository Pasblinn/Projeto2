# Manual do Usuario - RJ Usinagem

Guia de uso do sistema de gestao de Ordens de Producao (OPs) e
financeiro. O sistema funciona 100% offline: todos os dados ficam
salvos na propria maquina.

## 1. Acesso ao sistema

Abra o aplicativo (ou `http://localhost:5173` em desenvolvimento) e
entre com seu e-mail e senha.

Usuarios padrao do primeiro acesso (troque as senhas em uso real):

| E-mail | Senha | Perfil |
|--------|-------|--------|
| `admin@rjusinagem.com.br` | `admin123` | Financeiro |
| `chefe@rjusinagem.com.br` | `chefe123` | Chefe de Producao |
| `operador@rjusinagem.com.br` | `operador123` | Operador |

### Perfis e permissoes

- **Financeiro**: acesso total (OPs, producao, financeiro, relatorios).
- **Chefe de Producao**: OPs, aprovacao e registro de producao.
- **Operador**: visualiza OPs e atualiza status de producao.

## 2. Dashboard (Ordens de Producao)

Tela inicial com a lista de OPs. Recursos:

- **Busca e filtros** por cliente, status de producao e financeiro.
- **Nova OP**: botao no topo (apenas Chefe/Financeiro). Preencha tipo
  (encomenda ou estoque), cliente, descricao, quantidade e, se
  desejar, data de entrega, valor e forma de pagamento.
- Clique em uma OP para abrir os **detalhes**.

## 3. Detalhes da OP

Na pagina da OP voce pode:

1. **Aprovar** a OP (Chefe/Financeiro). OPs so entram em producao
   depois de aprovadas.
2. **Controlar a producao**: Iniciar, Pausar, Retomar, Finalizar ou
   Cancelar.
3. **Editar** os dados da OP.
4. Acompanhar a **barra de producao acumulada** (produzido / total).

## 4. Registrar Producao

Menu "Registrar Producao" (Chefe/Financeiro):

- Selecione a OP, a data e o turno (manha/tarde/noite), informe a
  quantidade produzida e as pecas defeituosas. O total produzido da OP
  eh atualizado automaticamente.
- **Registro de Defeitos**: registre tipo de defeito, quantidade,
  causa provavel e acao corretiva. O historico aparece logo abaixo.

## 5. Financeiro

Menu "Financeiro" (apenas perfil Financeiro), organizado em abas:

- **Dashboard**: faturamento total, recebido, a receber e maiores
  saldos em aberto.
- **Orcamentos**: crie, edite e exclua orcamentos. Fluxo de status:
  Rascunho -> Enviado -> Aprovado/Reprovado. Orcamento aprovado pode
  ser **convertido em OP** com um clique.
- **Contas a Receber**: OPs com saldo em aberto. Use "Registrar
  pagamento" para dar baixa (total ou parcial); o status financeiro da
  OP eh atualizado automaticamente.
- **OPs e Financeiro**: historico completo de movimentos (pagamentos,
  estornos, ajustes e custos extras), com filtro por OP e lancamento
  manual de movimentos.
- **Faturamento**: emita nota fiscal para OPs finalizadas e consulte
  as notas ja emitidas.
- **Relatorios**: atalho para a pagina de relatorios.

## 6. Relatorios (impressao em A4)

Menu "Relatorios" (perfil Financeiro). Selecione o relatorio, ajuste
os parametros e clique em **Imprimir** (usa a impressao do sistema;
escolha "Salvar como PDF" para gerar arquivo).

Relatorios disponiveis:

1. **Ficha de OP** - ficha completa de uma ordem.
2. **Resumo Financeiro** - totais e movimentos por periodo.
3. **Contas a Receber** - OPs com saldo em aberto.
4. **Historico do Cliente** - OPs e pagamentos de um cliente.
5. **Producao por Periodo** - producao resumida e detalhada.
6. **OPs por Status** - visao geral agrupada por status.

## 7. Dados e backup

Os dados ficam salvos localmente (ver
[docs/DATABASE.md](docs/DATABASE.md)). Recomendacoes:

- Faca backup periodico exportando a chave `rjusinagem.db.v1` do
  armazenamento local (instrucoes no documento acima).
- Nao limpe os dados de navegacao do app sem backup.

## 8. Problemas comuns

| Problema | Solucao |
|----------|---------|
| Nao consigo entrar | Confira e-mail/senha; usuarios padrao na secao 1 |
| Nao vejo o menu Financeiro | Seu perfil nao eh Financeiro |
| OP nao inicia producao | Aprove a OP primeiro |
| Relatorio sai em branco na impressao | Selecione o relatorio e os parametros antes de imprimir |
| Dados sumiram | Restaure o backup (docs/DATABASE.md) |
