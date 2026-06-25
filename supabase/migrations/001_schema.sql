-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ENUM-like check constraints are used instead of enums for flexibility

-- profiles (linked to auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  role text not null default 'vendedor' check (role in ('admin', 'vendedor')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- trigger: auto-create profile when auth user is created
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, nome, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), 'vendedor');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- clientes
create table clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade text not null default '',
  estado text not null default '',
  criado_em timestamptz not null default now()
);

-- carregamentos
create table carregamentos (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  data_entrega date,
  status text not null default 'agendado' check (status in ('agendado','realizado','cancelado')),
  cliente_id uuid references clientes(id),
  produto text not null default '',
  quantidade integer not null default 0,
  nf text not null default '',
  motorista text not null default '',
  fornecedor text not null default '',
  custo_total numeric(10,2) not null default 0,
  preco_m2 numeric(10,2) not null default 0,
  frete numeric(10,2) not null default 0,
  ad_servico numeric(10,2) not null default 0,
  custo_servico numeric(10,2) not null default 0,
  vendedor_id uuid not null references profiles(id),
  criado_em timestamptz not null default now()
);

-- metas
create table metas (
  id uuid primary key default gen_random_uuid(),
  mes integer not null check (mes between 1 and 12),
  ano integer not null,
  nivel text not null,
  lucro_min numeric(10,2) not null,
  lucro_max numeric(10,2) not null,
  percentual_comissao numeric(5,4) not null,
  unique(mes, ano, nivel)
);

-- financeiro
create table financeiro (
  id uuid primary key default gen_random_uuid(),
  mes integer not null check (mes between 1 and 12),
  ano integer not null,
  tipo text not null check (tipo in ('salario','comissao','imposto','compra_grama','frete','plantio','outros_fixo','outros_variavel')),
  categoria text not null check (categoria in ('fixa','variavel')),
  descricao text not null default '',
  valor numeric(10,2) not null,
  criado_em timestamptz not null default now()
);

-- =====================
-- RLS
-- =====================

alter table profiles enable row level security;
alter table clientes enable row level security;
alter table carregamentos enable row level security;
alter table metas enable row level security;
alter table financeiro enable row level security;

-- Helper function: current user role
create or replace function current_user_role()
returns text language sql security definer stable as $$
  select role from profiles where id = auth.uid()
$$;

-- Helper function: is admin
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select current_user_role() = 'admin'
$$;

-- profiles RLS
create policy "profiles: own or admin select"
  on profiles for select using (id = auth.uid() or is_admin());

create policy "profiles: own update"
  on profiles for update using (id = auth.uid() or is_admin());

-- clientes RLS (shared)
create policy "clientes: authenticated select"
  on clientes for select using (auth.role() = 'authenticated');

create policy "clientes: authenticated insert"
  on clientes for insert with check (auth.role() = 'authenticated');

create policy "clientes: authenticated update"
  on clientes for update using (auth.role() = 'authenticated');

create policy "clientes: admin delete"
  on clientes for delete using (is_admin());

-- carregamentos RLS
create policy "carregamentos: admin all"
  on carregamentos for all using (is_admin());

create policy "carregamentos: vendedor own select"
  on carregamentos for select using (vendedor_id = auth.uid());

create policy "carregamentos: vendedor own insert"
  on carregamentos for insert with check (vendedor_id = auth.uid());

create policy "carregamentos: vendedor own update"
  on carregamentos for update using (vendedor_id = auth.uid());

create policy "carregamentos: vendedor own delete"
  on carregamentos for delete using (vendedor_id = auth.uid());

-- metas RLS
create policy "metas: authenticated select"
  on metas for select using (auth.role() = 'authenticated');

create policy "metas: admin write"
  on metas for all using (is_admin());

-- financeiro RLS
create policy "financeiro: admin only"
  on financeiro for all using (is_admin());
