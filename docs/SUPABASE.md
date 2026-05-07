# Setup do Supabase

Guia para configurar o backend Supabase do projeto.

## 1. Criar projeto

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) e crie um novo projeto.
2. Escolha uma regiao proxima (ex: South America - Sao Paulo).
3. Defina uma senha forte para o banco (anote em local seguro).
4. Aguarde o provisionamento (~2 min).

## 2. Coletar credenciais

No painel do projeto, abra **Settings -> API**:

- **Project URL** -> `VITE_SUPABASE_URL`
- **anon / public key** -> `VITE_SUPABASE_ANON_KEY`

> A `service_role` key NAO deve ser usada no frontend. Ela ignora RLS.

## 3. Configurar variaveis locais

```bash
cp .env.example .env
# editar .env com os valores acima
```

O cliente Vite injeta essas variaveis em `import.meta.env`. Ver
[src/services/supabase.ts](../src/services/supabase.ts).

## 4. Aplicar o schema

### Opcao A - SQL Editor (mais simples)

1. Abra **SQL Editor** no painel do Supabase.
2. Cole o conteudo de [supabase/migrations/0001_initial_schema.sql](../supabase/migrations/0001_initial_schema.sql).
3. Execute.

### Opcao B - CLI (recomendado para times)

```bash
npm install -g supabase
supabase login
supabase link --project-ref <ref-do-projeto>
supabase db push
```

## 5. Criar primeiro usuario

O trigger `on_auth_user_created` cria o perfil em `public.users` automaticamente
ao registrar via `auth.users`. Por padrao todo novo usuario entra como
`operador`.

Para promover alguem a `chefe` ou `financeiro`, rode no SQL Editor:

```sql
update public.users
set role = 'financeiro'
where email = 'admin@rjusinagem.com.br';
```

> Mudancas de role NUNCA devem ser feitas pelo cliente. A policy `users_update_self`
> impede alteracao do campo `role` via API.

## 6. Verificar RLS

Toda tabela em `public` tem RLS ativado. Para conferir:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public';
```

Todas as linhas devem ter `rowsecurity = true`.

## Tabelas

| Tabela | Descricao |
|--------|-----------|
| `users` | Perfil ligado a `auth.users` (id, email, nome, role) |
| `ordens_producao` | OPs com status de producao e financeiro |

## Politicas resumidas

### `users`
- **SELECT**: usuario ve o proprio perfil; `chefe` e `financeiro` veem todos.
- **UPDATE**: usuario edita o proprio perfil mas nao pode mudar `role`.

### `ordens_producao`
- **SELECT**: qualquer autenticado.
- **INSERT**: apenas `chefe` ou `financeiro`.
- **UPDATE**: managers atualizam tudo; `operador` atualiza status.
- **DELETE**: apenas `financeiro`.

## Troubleshooting

**"Missing VITE_SUPABASE_URL"** -> arquivo `.env` ausente ou nao foi reiniciado o Vite (`npm run dev`).

**"new row violates row-level security policy"** -> usuario sem permissao para a operacao. Confira o `role` em `public.users`.

**Login retorna `invalid_credentials`** -> usuario ainda nao existe. Crie via **Authentication -> Users -> Add user** no painel.
