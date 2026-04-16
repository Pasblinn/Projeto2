# Arquitetura - RJ Usinagem

Documentacao da arquitetura tecnica planejada para o sistema.

## Visao Geral

Aplicacao cliente-servidor com cliente desktop (Electron) e mobile (browser),
ambos consumindo um backend gerenciado (Supabase).

```
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                │
│  - PostgreSQL (tabelas de OPs, producao, financeiro, ponto)     │
│  - Auth (email + senha)                                         │
│  - Row Level Security (RLS) por role                            │
│  - Storage (futuras imagens de pecas)                           │
│  - Edge Functions / RPC (funcoes de negocio)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
┌─────────────────────┐               ┌─────────────────────┐
│   DESKTOP (React)   │               │   MOBILE (React)    │
│   Electron wrapper  │               │   Browser (PWA)     │
│   Autenticado       │               │   Token UUID unico  │
└─────────────────────┘               └─────────────────────┘
```

## Camadas do Frontend

```
src/
├── components/     # UI reutilizavel (Button, Card, Modal, ...)
├── contexts/       # React Context (Auth, Toast)
├── pages/          # Views de rota (Dashboard, Financeiro, ...)
├── services/       # Cliente Supabase e funcoes de API
├── types/          # Tipos TypeScript compartilhados
├── utils/          # Utilitarios puros (formatacao, exportacao)
├── App.tsx         # Rotas e providers
└── main.tsx        # Entry point
```

### Principios

- **Componentes UI puros** nao sabem sobre Supabase. Recebem dados via props.
- **Pages** orquestram: chamam servicos, compoem componentes e gerenciam estado.
- **Services** encapsulam toda comunicacao com backend. Funcoes puras com
  assinaturas tipadas retornando Promises.
- **Contexts** sao usados apenas para estado global real (auth, toasts). Estado
  de tela fica em `useState` local.

## Modelagem de Dados

Entidades principais (detalhes em commits futuros):

- `users` - usuarios autenticados com role
- `ordens_producao` - OPs com status de producao e financeiro
- `registro_producao` - registros diarios de producao
- `registro_defeitos` - defeitos com causa e acao corretiva
- `orcamentos` - orcamentos que podem virar OPs
- `movimentos_financeiros` - ledger de pagamentos e ajustes
- `funcionarios_ponto` - funcionarios do modulo de ponto
- `registro_ponto` - registros de entrada e saida
- `auditoria` - log de alteracoes sensiveis

## Controle de Acesso

3 roles com permissoes diferentes:

| Role       | OPs              | Producao | Financeiro | Ponto     |
| ---------- | ---------------- | -------- | ---------- | --------- |
| Operador   | Visualizar       | Criar    | -          | -         |
| Chefe      | Criar, Aprovar   | Criar    | -          | -         |
| Financeiro | Tudo             | Criar    | Tudo       | Gerenciar |

Enforcement:
- Frontend: ocultacao de botoes/abas por role
- Backend: Row Level Security no Supabase (fonte da verdade)

## Decisoes Tecnicas

### Por que Vite?
Dev server rapido, HMR excelente, build otimizado com Rollup. Integra bem com
Electron para build de producao.

### Por que Supabase?
PostgreSQL gerenciado + Auth + RLS em um unico servico. Plano gratuito
suficiente para MVP (500 MB). Cliente TypeScript oficial bem tipado.

### Por que Tailwind?
Prototipagem rapida, sem troca de contexto entre CSS e JSX. Purge automatico
resulta em bundle pequeno. Utilitarios de impressao customizados para A4.

### Por que Electron?
Usuarios finais pediram app desktop instalavel no Windows. Electron reusa
100% do codigo React. Trade-off: binario maior (~150MB), aceitavel.

### Por que Mobile via browser (nao nativo)?
Ponto eletronico eh fluxo simples (1 botao). PWA suficiente, evita custo
de loja de apps e build nativo. Acesso via link curto enviado por WhatsApp.

## Fluxo de Build

### Desenvolvimento
```
npm run dev
   → Vite serve em localhost:5173
   → HMR ativo
   → (Fase 10+) Electron abre janela apontando para o dev server
```

### Producao
```
npm run build
   → tsc (type check)
   → Vite build → dist/
   → (Fase 10+) electron-builder → instalador .exe em dist-electron/
```

## Padroes de Codigo

- TypeScript em modo strict
- Funcoes pequenas (<20 linhas preferidas)
- Nomes descritivos em ingles (codigo) e pt-BR (UI)
- Sem comentarios explicando "o que" - apenas "porque" quando nao obvio
- Conventional Commits

## Referencias

- [Supabase Docs](https://supabase.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Electron Docs](https://www.electronjs.org/docs/latest)
