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

## Fase 3 - Supabase e Autenticacao

Integracao com backend e controle de sessao.

- [ ] `feat: add Supabase client configuration`
- [ ] `feat: add AuthContext with session management`
- [ ] `feat: add Login page`
- [ ] `feat: add database schema SQL (users, ordens_producao)`
- [ ] `docs: add Supabase setup instructions`

## Fase 4 - Layout e Rotas

Estrutura de navegacao do app autenticado.

- [ ] `feat: add Layout component with sidebar`
- [ ] `feat: add React Router with protected routes`
- [ ] `feat: add role-based route guards`

## Fase 5 - Ordens de Producao

Modulo principal de OPs: CRUD, aprovacao e status.

- [ ] `feat: add Dashboard page with OP list`
- [ ] `feat: add OP creation form`
- [ ] `feat: add OP details page`
- [ ] `feat: add OP edit flow`
- [ ] `feat: add OP approval workflow`
- [ ] `feat: add OP status controls (iniciar, pausar, finalizar)`
- [ ] `feat: add search and filter on Dashboard`

## Fase 6 - Registro de Producao

Registro diario de producao e defeitos.

- [ ] `feat: add production registration form`
- [ ] `feat: add accumulated production progress bar`
- [ ] `feat: add defect registration with cause and action`

## Fase 7 - Modulo Financeiro

Controle financeiro completo (6 abas).

- [ ] `feat: add Financeiro page skeleton with tabs`
- [ ] `feat: add Dashboard financeiro tab`
- [ ] `feat: add Orcamentos tab with CRUD`
- [ ] `feat: add orcamento to OP conversion`
- [ ] `feat: add Contas a Receber tab with payment tracking`
- [ ] `feat: add OPs e Financeiro tab with ledger history`
- [ ] `feat: add Faturamento tab with NF issuance`

## Fase 8 - Relatorios

Relatorios imprimiveis em formato A4.

- [ ] `feat: add Relatorios tab`
- [ ] `feat: add Ficha de OP report`
- [ ] `feat: add Resumo Financeiro report`
- [ ] `feat: add Contas a Receber report`
- [ ] `feat: add Historico do Cliente report`
- [ ] `feat: add Producao por Periodo report`
- [ ] `feat: add OPs por Status report`

## Fase 9 - Ponto Eletronico

Sistema de ponto com interface desktop e mobile.

- [ ] `feat: add funcionarios_ponto and registro_ponto tables`
- [ ] `feat: add RPC functions (bater_ponto, etc.)`
- [ ] `feat: add PontoTab desktop component`
- [ ] `feat: add PontoMobile page with token auth`
- [ ] `feat: add horas por periodo report`

## Fase 10 - Electron

Empacotamento como aplicacao desktop para Windows.

- [ ] `chore: add Electron main and preload scripts`
- [ ] `chore: configure electron-builder for Windows installer`
- [ ] `chore: add app icons`
- [ ] `docs: add build and distribution instructions`

## Fase 11 - Documentacao Final

- [ ] `docs: add user manual (MANUAL_USUARIO.md)`
- [ ] `docs: add deployment checklist (PROXIMOS_PASSOS.md)`
- [ ] `docs: add ponto eletronico guide (PONTO.md)`

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
