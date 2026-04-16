# Contribuindo - RJ Usinagem

Guia para contribuir com o projeto.

## Setup do Ambiente

```bash
git clone https://github.com/Pasblinn/Projeto2.git
cd Projeto2
npm install
npm run dev
```

## Fluxo de Trabalho

1. Crie uma branch a partir de `main`:
   ```bash
   git checkout -b feature/descricao-curta
   ```

2. Faca suas alteracoes em commits pequenos e atomicos.

3. Antes de commitar:
   - Rode `npm run build` para garantir que o type check passa
   - Teste manualmente em `npm run dev`

4. Abra um Pull Request para `main`.

## Padroes de Commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org):

```
<tipo>: <descricao curta em imperativo>

<corpo opcional explicando o porque>
```

### Tipos aceitos

| Tipo       | Uso                                              |
| ---------- | ------------------------------------------------ |
| `feat`     | Nova funcionalidade                              |
| `fix`      | Correcao de bug                                  |
| `chore`    | Build, config, dependencias                      |
| `docs`     | Apenas documentacao                              |
| `refactor` | Mudanca sem alterar comportamento                |
| `test`     | Adicao ou correcao de testes                     |
| `style`    | Formatacao, sem mudanca de logica                |
| `perf`     | Melhoria de performance                          |

### Exemplos

```
feat: add Button component with variants
fix: correct date formatting in OrdemProducaoDetalhes
chore: bump tailwindcss from 3.4.1 to 3.4.3
docs: document RLS policies in ARCHITECTURE.md
refactor: extract calculation helpers to utils/financial.ts
```

## Padroes de Codigo

### TypeScript
- Sempre tipar parametros e retornos de funcoes exportadas
- Evitar `any` - usar `unknown` ou tipos especificos
- Usar `interface` para objetos, `type` para unioes/aliases

### React
- Componentes funcionais com hooks
- Props tipadas via `interface`
- Um componente por arquivo
- PascalCase no nome do arquivo e do componente

### Nomenclatura
- Arquivos: kebab-case (ex.: `ordem-producao-form.tsx`) OU PascalCase para
  componentes React (ex.: `OrdemProducaoForm.tsx`)
- Variaveis e funcoes: camelCase
- Constantes: UPPER_SNAKE_CASE
- Tipos e interfaces: PascalCase

### Estilo
- Tailwind utility-first; extrair para classes de componente em
  `@layer components` quando reutilizado em 3+ lugares
- Evitar CSS inline (`style={{}}`) exceto para valores dinamicos

### Organizacao
- Imports em ordem: bibliotecas, @/services, @/components, tipos locais
- Limite indicativo: 200 linhas por arquivo, 20 linhas por funcao

## Checklist antes do PR

- [ ] `npm run build` passa sem erros
- [ ] Testei manualmente o fluxo afetado
- [ ] Nenhum `console.log` esquecido
- [ ] Commits seguem Conventional Commits
- [ ] Documentacao atualizada se necessario

## Estrutura de Commits Recomendada

Prefira commits pequenos e focados:

```
# BOM (3 commits)
feat: add Button component
feat: add Input component
feat: add Card component

# RUIM (1 commit gigante)
feat: add design system components
```

Exception: setup inicial ou refactors amplos podem ser commits maiores.
