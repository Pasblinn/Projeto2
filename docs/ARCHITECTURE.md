# Arquitetura - RJ Usinagem

Documentacao da arquitetura tecnica do sistema.

## Visao Geral

Aplicacao desktop totalmente local: o frontend React roda dentro do
Electron (ou no navegador, em desenvolvimento) e o banco de dados eh um
**PostgreSQL embutido** (PGlite) que vive no proprio processo do app.
Nao ha backend remoto nem dependencia de internet.

```text
┌─────────────────────────────────────────────────────────────────┐
│                     APP DESKTOP (Electron)                      │
│                                                                 │
│  ┌───────────────────────┐      ┌───────────────────────────┐  │
│  │   FRONTEND (React)    │      │   POSTGRESQL (PGlite)     │  │
│  │   pages + components  │ ───► │   engine oficial em WASM  │  │
│  │   contexts + services │ SQL  │   schema relacional + FKs │  │
│  └───────────────────────┘      └─────────────┬─────────────┘  │
│                                               │                 │
│                                               ▼                 │
│                                  Persistencia local (IndexedDB) │
└─────────────────────────────────────────────────────────────────┘
```

## Camadas do Frontend

```text
src/
├── components/     # UI reutilizavel (Button, Card, Modal, ...)
│   ├── financeiro/ # Abas do modulo financeiro
│   └── reports/    # Relatorios imprimiveis em A4
├── contexts/       # React Context (Auth, Toast)
├── pages/          # Views de rota (Dashboard, OrdemDetalhes, ...)
├── services/       # Camada de dados: db (SQL) + regras de negocio
├── types/          # Tipos TypeScript compartilhados
├── utils/          # Utilitarios puros (formatacao)
├── App.tsx         # Rotas e providers (HashRouter)
└── main.tsx        # Entry point
```

### Principios

- **Componentes UI puros** nao sabem sobre o banco. Recebem dados via props.
- **Pages** orquestram: chamam servicos, compoem componentes e gerenciam estado.
- **Services** encapsulam toda a logica de dados. Funcoes assincronas
  tipadas; apenas `services/db.ts` fala SQL diretamente.
- **Contexts** sao usados apenas para estado global real (auth, toasts).
  Estado de tela fica em `useState` local.

## Camada de Dados

`services/db.ts` concentra o acesso ao PostgreSQL embutido:

- Cria o schema na primeira execucao (`CREATE TABLE IF NOT EXISTS`).
- Expoe helpers genericos (`listRows`, `findRow`, `insertRow`,
  `updateRow`, `deleteRow`, `nextCounter`) e `query()` para SQL livre.
- Integridade referencial: `FOREIGN KEY ... ON DELETE CASCADE` liga
  producao, defeitos, movimentos e notas a sua OP.

Modelagem (detalhes em [DATABASE.md](DATABASE.md)):

- `users` - usuarios locais com role e hash de senha
- `ordens_producao` - OPs completas (material, cliente, peca, precos,
  aprovacao por supervisor, cronometro de setup)
- `registros_producao` - producao diaria (turno, horario, operacao)
- `registros_defeito` - defeitos com causa e acao corretiva
- `orcamentos` - orcamentos que podem virar OPs
- `movimentos_financeiros` - ledger de pagamentos, estornos e custos
- `notas_fiscais` - notas emitidas por OP
- `counters` - sequenciais atomicos (orcamento, NF)

## Controle de Acesso

3 roles com permissoes diferentes:

| Role       | OPs                | Producao  | Financeiro |
| ---------- | ------------------ | --------- | ---------- |
| Operador    | Ver, criar, editar | Registrar | -          |
| Encarregado | Tudo               | Registrar | Tudo       |
| Financeiro  | Tudo               | Registrar | Tudo       |

Enforcement: rotas protegidas (`ProtectedRoute` + `RoleGuard`) e menu
dinamico por role. Como o app eh local e mono-usuario por maquina, o
frontend eh a fronteira de autorizacao.

## Decisoes Tecnicas

### Por que PostgreSQL embutido (PGlite)?

Requisito do projeto: banco local e PostgreSQL. O PGlite empacota o
engine oficial do Postgres em WASM dentro do app — schema SQL real,
constraints e queries parametrizadas — sem instalar servico nem
depender de internet. Zero configuracao para o usuario final.

### Por que Vite?

Dev server rapido, HMR excelente, build otimizado com Rollup. Integra
bem com Electron para build de producao.

### Por que Tailwind?

Prototipagem rapida, sem troca de contexto entre CSS e JSX. Purge
automatico resulta em bundle pequeno. Utilitarios de impressao
customizados para A4.

### Por que Electron?

Usuarios finais pediram app desktop instalavel. Electron reusa 100% do
codigo React. Trade-off: binario maior (~140MB), aceitavel.

### Por que HashRouter?

O app empacotado carrega via `file://`, onde roteamento por historico
(BrowserRouter) nao resolve caminhos.

## Fluxo de Build

### Desenvolvimento

```bash
npm run dev          # Vite em localhost:5173, HMR ativo
npm run electron:dev # janela Electron apontando para o dev server
```

### Producao

```bash
npm run build                 # tsc (type check) + Vite build → dist/
npm run electron:build:linux  # electron-builder → AppImage em release/
npm run electron:build        # electron-builder → instalador Windows
```

## Padroes de Codigo

- TypeScript em modo strict
- Funcoes pequenas e coesas
- Nomes descritivos em ingles (codigo) e pt-BR (UI)
- Sem comentarios explicando "o que" - apenas "porque" quando nao obvio
- Conventional Commits

## Referencias

- [PGlite Docs](https://pglite.dev)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Electron Docs](https://www.electronjs.org/docs/latest)
