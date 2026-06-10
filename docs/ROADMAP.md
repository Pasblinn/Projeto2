# Roadmap - Projeto RJ Usinagem

Plano de construcao incremental do sistema. Cada fase eh composta por
commits pequenos e independentes, seguindo Conventional Commits.

## Fase 1 - Fundacao (em andamento)

Setup inicial do projeto: ferramentas de build, linguagem e estilizacao.

- [x] Commit 1: `chore: initialize React project with Vite and TypeScript`
- [x] Commit 2: `chore: configure Tailwind CSS and PostCSS`
- [x] Commit 3: `chore: add path aliases and TypeScript strict config`
- [x] Commit 4: `docs: add initial README and project roadmap`

## Fase 2 - Design System (concluida)

Componentes reutilizaveis de UI e tipos compartilhados.

- [x] `feat: add TypeScript types for domain entities`
- [x] `feat: add Button component with variants`
- [x] `feat: add Input and Textarea form components`
- [x] `feat: add Select component`
- [x] `feat: add Card component`
- [x] `feat: add Modal component`
- [x] `feat: add StatusBadge component`
- [x] `feat: add Toast notification system`

## Fase 3 - Supabase e Autenticacao (concluida)

Integracao com backend e controle de sessao.

> Nota: o Supabase foi substituido por um banco de dados local na
> refatoracao apos a Fase 5 (ver abaixo). O sistema agora funciona
> 100% offline.

- [x] `feat: add Supabase client configuration`
- [x] `feat: add AuthContext with session management`
- [x] `feat: add Login page`
- [x] `feat: add database schema SQL (users, ordens_producao)`
- [x] `docs: add Supabase setup instructions`

## Fase 4 - Layout e Rotas (concluida)

Estrutura de navegacao do app autenticado.

- [x] `feat: add Layout component with sidebar`
- [x] `feat: add React Router with protected routes`
- [x] `feat: add role-based route guards`

## Fase 5 - Ordens de Producao (concluida)

Modulo principal de OPs: CRUD, aprovacao e status.

- [x] `feat: add Dashboard page with OP list`
- [x] `feat: add OP creation form`
- [x] `feat: add OP details page`
- [x] `feat: add OP edit flow`
- [x] `feat: add OP approval workflow`
- [x] `feat: add OP status controls (iniciar, pausar, finalizar)`
- [x] `feat: add search and filter on Dashboard`

## Refatoracao - Banco de Dados Local (concluida)

Decisao de arquitetura: o banco de dados passa a ser local apenas
(localStorage), eliminando a dependencia do Supabase e de internet.

- [x] `feat: add local database storage layer`
- [x] `refactor: replace Supabase auth with local auth service`
- [x] `refactor: migrate ordens service to local database`
- [x] `chore: remove Supabase dependency and config`
- [x] `docs: replace Supabase guide with local database guide`

## Fase 6 - Registro de Producao (concluida)

Registro diario de producao e defeitos.

- [x] `feat: add production registration form`
- [x] `feat: add accumulated production progress bar`
- [x] `feat: add defect registration with cause and action`

## Fase 7 - Modulo Financeiro (concluida)

Controle financeiro completo (6 abas).

- [x] `feat: add Financeiro page skeleton with tabs`
- [x] `feat: add Dashboard financeiro tab`
- [x] `feat: add Orcamentos tab with CRUD`
- [x] `feat: add orcamento to OP conversion`
- [x] `feat: add Contas a Receber tab with payment tracking`
- [x] `feat: add OPs e Financeiro tab with ledger history`
- [x] `feat: add Faturamento tab with NF issuance`

## Fase 8 - Relatorios (concluida)

Relatorios imprimiveis em formato A4.

- [x] `feat: add Relatorios tab`
- [x] `feat: add Ficha de OP report`
- [x] `feat: add Resumo Financeiro report`
- [x] `feat: add Contas a Receber report`
- [x] `feat: add Historico do Cliente report`
- [x] `feat: add Producao por Periodo report`
- [x] `feat: add OPs por Status report`

## Fase 9 - Ponto Eletronico (removida do escopo)

O modulo de ponto eletronico foi removido do escopo do projeto.
O sistema cobre apenas gestao de OPs, producao e financeiro.

## Fase 10 - Electron

Empacotamento como aplicacao desktop para Windows.

- [ ] `chore: add Electron main and preload scripts`
- [ ] `chore: configure electron-builder for Windows installer`
- [ ] `chore: add app icons`
- [ ] `docs: add build and distribution instructions`

## Fase 11 - Documentacao Final

- [ ] `docs: add user manual (MANUAL_USUARIO.md)`
- [ ] `docs: add deployment checklist (PROXIMOS_PASSOS.md)`

## Convencoes

### Commits
Usamos [Conventional Commits](https://www.conventionalcommits.org):

- `feat:` - nova funcionalidade
- `fix:` - correcao de bug
- `chore:` - tarefas de build, config, dependencias
- `docs:` - apenas documentacao
- `refactor:` - mudanca sem alterar comportamento
- `test:` - adicao ou correcao de testes
- `style:` - formatacao, sem mudanca de logica

### Branches
- `main` - branch principal, sempre estavel
- `feature/nome-da-feature` - nova funcionalidade
- `fix/descricao` - correcao de bug
- `chore/descricao` - tarefas de infra

### Pull Requests
- Commits pequenos e atomicos
- Mensagens claras e descritivas
- Revisao antes do merge
