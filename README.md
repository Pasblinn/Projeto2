# RJ Usinagem — Sistema de Gestao de Producao

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-42-47848F?logo=electron&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PGlite-4169E1?logo=postgresql&logoColor=white)
![Status](https://img.shields.io/badge/status-concluido-success)

Sistema desktop para gestao industrial de uma usinagem: controle completo de
**Ordens de Producao (OPs)**, registro de producao diaria no chao de fabrica,
**modulo financeiro** (orcamentos, contas a receber, faturamento) e
**relatorios imprimiveis em A4** — funcionando 100% offline, com banco
**PostgreSQL local embutido** no proprio aplicativo.

## Sumario

- [Funcionalidades](#funcionalidades)
- [Stack Tecnica](#stack-tecnica)
- [Arquitetura](#arquitetura)
- [Como Rodar](#como-rodar)
- [Builds de Producao](#builds-de-producao)
- [Documentacao](#documentacao)
- [Equipe](#equipe)
- [Licenca](#licenca)

## Funcionalidades

### Dashboard executivo (visao do dono)

- **KPIs industriais**: faturamento, recebido e a receber, margem estimada
  (servico vs. custo de material), taxa de refugo, OPs ativas e atrasadas
- **Graficos** (recharts): faturamento e recebimento por mes, OPs por
  status (rosca), producao diaria (operacoes x defeituosas) e top clientes
- Metricas calculadas no banco com SQL (`GROUP BY`, `SUM`, `GREATEST`)

### Ordens de Producao

- Codigo sequencial por ano (`OP-2026-0001`), gerado automaticamente
- Cadastro completo: datas de inicio/termino, secao de **material**
  (material, codigo, quantidade, lote, fornecedor), cliente com CNPJ,
  nome da peca, quantidade com unidade, **preco do servico** e **preco
  gasto com material**, maquina utilizada e operador responsavel
- **Aprovacao por supervisor** (nome e data registrados); apos aprovada,
  a OP fica travada para edicao
- Controle de status: criada → em producao → pausada/finalizada/cancelada
- **Cronometro de preparacao de maquina** (setup) com tempo acumulado
- **Producao diaria** registrada na propria OP: turno, horario de
  inicio/fim, descricao da operacao realizada, maquina e pecas defeituosas
- **Registro de defeitos** com tipo, causa provavel e acao corretiva
- Exclusao em cascata (producao, defeitos, movimentos e notas associados)

### Financeiro (6 abas)

- **Dashboard**: faturamento total, recebido, a receber e maiores saldos
- **Orcamentos**: CRUD com fluxo rascunho → enviado → aprovado/reprovado
  e **conversao de orcamento aprovado em OP** com um clique
- **Contas a Receber**: baixa de pagamentos (total ou parcial) com
  atualizacao automatica do status financeiro (pendente/parcial/pago/atrasado)
- **OPs e Financeiro**: ledger completo de movimentos (pagamentos,
  estornos, ajustes e custos extras) com filtro por OP
- **Faturamento**: emissao de nota fiscal interna com numeracao sequencial
- **Relatorios**: atalho para a central de relatorios

### Relatorios (impressao A4)

1. Ficha de OP (dados gerais, material, producao, defeitos e financeiro)
2. Resumo Financeiro por periodo
3. Contas a Receber
4. Historico do Cliente
5. Producao por Periodo
6. OPs por Status

### Seguranca e perfis

- Autenticacao local com senha em hash SHA-256
- 3 niveis de permissao com guarda de rotas e menu dinamico:

| Perfil | Permissoes |
| ------ | ---------- |
| Dono | Acesso total (OPs, financeiro, relatorios) |
| Encarregado | Acesso total (OPs, financeiro, relatorios) |
| Operador | Restrito as OPs: ve, cria, edita e registra producao |

## Stack Tecnica

| Tecnologia | Uso |
| ---------- | --- |
| React 18 + TypeScript 5 | Interface e tipagem estatica |
| Vite 5 | Build tool e dev server |
| Tailwind CSS 3 | Estilizacao |
| React Router 6 (HashRouter) | Navegacao (compativel com `file://`) |
| lucide-react | Icones |
| Electron 42 + electron-builder | Empacotamento desktop (Windows/Linux) |
| PostgreSQL (PGlite) | Banco de dados local embutido, schema SQL relacional |

## Arquitetura

O banco de dados eh **PostgreSQL local**, embutido no proprio app via
PGlite (engine oficial do Postgres em WASM): tabelas relacionais com
chaves estrangeiras `ON DELETE CASCADE`, queries SQL parametrizadas e
persistencia na maquina — sem backend remoto e sem servico para
instalar. Detalhes em [docs/DATABASE.md](docs/DATABASE.md).

```text
src/
├── components/        # Design system (Button, Card, Modal, Toast...)
│   ├── financeiro/    # Abas do modulo financeiro
│   └── reports/       # Relatorios imprimiveis em A4
├── contexts/          # AuthContext, ToastContext
├── pages/             # Login, Dashboard, OrdemDetalhes, Financeiro, Relatorios
├── services/          # db (persistencia), auth, ordens, producao,
│                      # orcamentos, financeiro, faturamento, metrics
├── types/             # Tipos de dominio
└── utils/             # Formatacao (moeda, data, labels)
electron/              # Main e preload do app desktop
docs/                  # Documentacao tecnica
```

## Como Rodar

Pre-requisitos: Node.js 18+ e npm.

```bash
git clone https://github.com/Pasblinn/Projeto2.git
cd Projeto2
npm install
npm run dev        # http://localhost:5173
```

### Primeiro acesso

Na primeira execucao o banco eh criado vazio e os usuarios padrao sao
semeados automaticamente:

| E-mail | Senha | Perfil |
| ------ | ----- | ------ |
| `admin@rjusinagem.com.br` | `admin123` | Dono |
| `encarregado@rjusinagem.com.br` | `encarregado123` | Encarregado |
| `operador@rjusinagem.com.br` | `operador123` | Operador |

## Builds de Producao

```bash
npm run build                # build web (dist/)
npm run electron:build:linux # AppImage Linux (release/)
npm run electron:build       # instalador Windows NSIS (requer Windows ou Wine)
```

O AppImage gerado em `release/` roda com clique duplo, sem instalacao.
Guia completo em [docs/BUILD.md](docs/BUILD.md).

## Documentacao

- [Manual do Usuario](MANUAL_USUARIO.md)
- [Banco de Dados Local](docs/DATABASE.md)
- [Build e Distribuicao](docs/BUILD.md)
- [Roadmap de Desenvolvimento](docs/ROADMAP.md)
- [Checklist de Implantacao](PROXIMOS_PASSOS.md)
- [Arquitetura](docs/ARCHITECTURE.md) e [Contribuicao](docs/CONTRIBUTING.md)

## Equipe

| Integrante |
| ---------- |
| Pablo Tadini |
| Raul Souza |
| Rafael Adonis |
| Gabriel Maestre |
| Gabriel Capri |

## Licenca

Projeto academico desenvolvido para a disciplina — propriedade da equipe.
Todos os direitos reservados.
