# RJ Usinagem - Sistema de Gestao de Producao

Sistema desktop para gestao de Ordens de Producao (OPs), controle financeiro e
ponto eletronico da RJ Usinagem.

## Visao Geral

Aplicacao completa de gestao industrial desenvolvida com React, TypeScript e
Supabase. Projetada para ser simples e visual, ideal para usuarios sem
experiencia previa com sistemas ERP.

### Caracteristicas

- Desktop app para Windows (via Electron, a partir da Fase 2)
- Banco de dados remoto compartilhado (PostgreSQL + Supabase)
- Interface limpa com Tailwind CSS
- 3 niveis de permissao: Financeiro, Chefe e Operador
- Gestao de Ordens de Producao do orcamento ao pagamento
- Controle financeiro com relatorios imprimiveis em A4
- Ponto eletronico mobile (sem login, via token unico)

## Stack Tecnica

| Tecnologia       | Versao | Uso                              |
| ---------------- | ------ | -------------------------------- |
| React            | 18.2   | Biblioteca de UI                 |
| TypeScript       | 5.3    | Tipagem estatica                 |
| Vite             | 5.0    | Build tool e dev server          |
| Tailwind CSS     | 3.4    | Framework CSS utilitario         |
| PostCSS          | 8.4    | Processamento de CSS             |

Dependencias adicionais serao introduzidas em commits subsequentes:
React Router, Supabase Client, Electron, Lucide React, date-fns, jsPDF, etc.

## Pre-requisitos

- Node.js 18 ou superior
- npm

## Instalacao

```bash
git clone https://github.com/Pasblinn/Projeto2.git
cd Projeto2
npm install
```

## Scripts Disponiveis

```bash
npm run dev        # Inicia o servidor de desenvolvimento em localhost:5173
npm run build      # Build de producao (type check + Vite build)
npm run preview    # Preview do build de producao
```

## Estrutura do Projeto

```
Projeto2/
├── src/
│   ├── App.tsx           # Componente raiz
│   ├── main.tsx          # Entry point React
│   ├── index.css         # Tailwind + estilos globais + print CSS
│   └── vite-env.d.ts     # Tipos para import.meta.env
├── index.html            # HTML template
├── vite.config.ts        # Configuracao do Vite (com alias @/*)
├── tailwind.config.js    # Tema Tailwind (cores primary customizadas)
├── postcss.config.js     # PostCSS com Tailwind + autoprefixer
├── tsconfig.json         # TypeScript strict + paths
├── tsconfig.node.json    # TS config para vite.config.ts
└── package.json
```

## Path Aliases

Imports limpos usando `@/` como atalho para `src/`:

```ts
import Button from '@/components/Button'
import { supabase } from '@/services/supabase'
```

## Roadmap de Desenvolvimento

O projeto esta sendo construido de forma incremental, commit por commit.
Fases planejadas:

1. **Fundacao** (atual) - Vite, TypeScript, Tailwind, aliases
2. **Design System** - Componentes base (Button, Input, Card, Modal, Toast)
3. **Supabase + Auth** - Cliente, contexto de autenticacao, login
4. **Layout e Rotas** - Layout autenticado, rotas protegidas
5. **Ordens de Producao** - CRUD, aprovacao, status
6. **Registro de Producao** - Producao diaria, defeitos
7. **Modulo Financeiro** - Orcamentos, contas a receber, faturamento
8. **Relatorios** - 6 tipos imprimiveis em A4
9. **Ponto Eletronico** - Desktop + Mobile (via token)
10. **Electron** - App desktop para Windows
11. **Documentacao Final** - Manual do usuario, deploy

Ver `docs/ROADMAP.md` para detalhes de cada fase.

## Licenca

Propriedade da RJ Usinagem - Todos os direitos reservados.
