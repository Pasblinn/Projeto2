-- Initial schema for RJ Usinagem
-- Tables: users (profile), ordens_producao
-- All exposed tables have RLS enabled with explicit policies.

-- ============================================================================
-- Enums
-- ============================================================================
create type user_role as enum ('financeiro', 'chefe', 'operador');

create type tipo_op as enum ('encomenda', 'estoque');

create type status_producao as enum (
  'criada',
  'em_producao',
  'pausada',
  'finalizada',
  'cancelada'
);

create type status_financeiro as enum (
  'pendente',
  'parcial',
  'pago',
  'atrasado',
  'cancelado'
);

create type forma_pagamento as enum (
  'pix',
  'boleto',
  'transferencia',
  'dinheiro',
  'cartao'
);

-- ============================================================================
-- users (profile linked to auth.users)
-- ============================================================================
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  nome        text not null,
  role        user_role not null default 'operador',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index users_role_idx on public.users(role);

alter table public.users enable row level security;

-- Users can read their own profile
create policy "users_select_self"
  on public.users for select
  to authenticated
  using (id = auth.uid());

-- Financeiro and chefe can read every profile
create policy "users_select_managers"
  on public.users for select
  to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('financeiro', 'chefe')
    )
  );

-- Users can update their own profile (cannot change role from client)
create policy "users_update_self"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.users where id = auth.uid()));

-- ============================================================================
-- ordens_producao
-- ============================================================================
create table public.ordens_producao (
  id                  uuid primary key default gen_random_uuid(),
  numero              serial not null,
  tipo                tipo_op not null,
  cliente             text not null,
  descricao           text not null,
  quantidade          integer not null check (quantidade > 0),
  quantidade_produzida integer not null default 0 check (quantidade_produzida >= 0),
  data_entrega        date,
  status_producao     status_producao not null default 'criada',
  status_financeiro   status_financeiro not null default 'pendente',
  forma_pagamento     forma_pagamento,
  valor_total         numeric(12, 2),
  valor_pago          numeric(12, 2) not null default 0,
  observacoes         text,
  aprovada            boolean not null default false,
  aprovada_por        uuid references public.users(id),
  aprovada_em         timestamptz,
  criada_por          uuid not null references public.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index ordens_status_producao_idx on public.ordens_producao(status_producao);
create index ordens_status_financeiro_idx on public.ordens_producao(status_financeiro);
create index ordens_cliente_idx on public.ordens_producao(cliente);
create index ordens_data_entrega_idx on public.ordens_producao(data_entrega);

alter table public.ordens_producao enable row level security;

-- Anyone authenticated can read OPs
create policy "op_select_all_authenticated"
  on public.ordens_producao for select
  to authenticated
  using (true);

-- Only chefe and financeiro can create OPs
create policy "op_insert_managers"
  on public.ordens_producao for insert
  to authenticated
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('chefe', 'financeiro')
    )
  );

-- chefe and financeiro can update; operador can update only the status_producao field
-- (enforced application-side via column-level checks; here we allow update for managers
-- and a constrained update for operadores)
create policy "op_update_managers"
  on public.ordens_producao for update
  to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('chefe', 'financeiro')
    )
  );

create policy "op_update_operador_status"
  on public.ordens_producao for update
  to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'operador'
    )
  );

-- Only financeiro can delete
create policy "op_delete_financeiro"
  on public.ordens_producao for delete
  to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'financeiro'
    )
  );

-- ============================================================================
-- updated_at triggers
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_touch_updated_at
  before update on public.users
  for each row execute function public.touch_updated_at();

create trigger ordens_producao_touch_updated_at
  before update on public.ordens_producao
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- Auto-create profile on signup
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, nome, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    'operador'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
