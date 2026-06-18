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
| `admin@rjusinagem.com.br` | `admin123` | Dono |
| `encarregado@rjusinagem.com.br` | `encarregado123` | Encarregado |
| `operador@rjusinagem.com.br` | `operador123` | Operador |

### Perfis e permissoes

- **Dono**: acesso total (Dashboard executivo, OPs, Financeiro, Relatorios).
- **Encarregado**: OPs (aprova/cancela/exclui), Financeiro e Relatorios;
  **nao** acessa o Dashboard executivo (exclusivo do Dono).
- **Operador**: restrito as OPs — visualiza, cria, edita e registra
  producao. Nao acessa Financeiro nem Relatorios.

## 2. Dashboard (Ordens de Producao)

Tela inicial com a lista de OPs. Recursos:

- **Busca e filtros** por cliente, peca, codigo, status de producao e
  financeiro.
- **Nova OP**: botao no topo (qualquer perfil pode criar; aprovar e excluir sao restritos a Encarregado/Dono). O formulario eh
  dividido em secoes: dados gerais (tipo, datas de inicio/termino),
  material (material, codigo, quantidade, lote, fornecedor), cliente e
  peca (cliente, CNPJ, nome da peca, quantidade + unidade, preco do
  servico e preco gasto com material), producao (maquina, operador
  responsavel) e financeiro.
- O codigo da OP eh gerado automaticamente no formato `OP-ANO-NNNN`.
- Clique em uma OP para abrir os **detalhes**.

## 3. Detalhes da OP

Toda a operacao da OP acontece nesta pagina:

1. **Controlar a producao** no topo: Iniciar, Pausar, Retomar,
   Finalizar ou Cancelar.
2. **Aprovar** a OP (Encarregado/Dono): informe o nome do supervisor.
   Apos aprovada, a OP nao pode mais ser editada.
3. **Editar** (somente enquanto nao aprovada) e **Excluir** (remove
   tambem producao, defeitos e movimentos associados).
4. **Preparacao da Maquina**: cronometro de setup com Iniciar/Pausar;
   o tempo acumulado fica salvo na OP.
5. **Producao Diaria**: registre cada operacao com data, turno, hora
   de inicio/fim, descricao da operacao realizada, maquina e pecas
   defeituosas. Os registros podem ser editados.
6. **Pecas Defeituosas**: registre tipo de defeito, quantidade, causa
   provavel e acao corretiva.

## 5. Financeiro

Menu "Financeiro" (Encarregado/Dono), organizado em abas:

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

Menu "Relatorios" (Encarregado/Dono). Selecione o relatorio, ajuste
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
| Nao vejo o menu Financeiro | Seu perfil eh Operador (so Encarregado/Dono veem o Financeiro) |
| OP nao inicia producao | Aprove a OP primeiro |
| Relatorio sai em branco na impressao | Selecione o relatorio e os parametros antes de imprimir |
| Dados sumiram | Restaure o backup (docs/DATABASE.md) |
