-- Migration: 20260819000001_identity
-- Fundação multi-tenant: função de timestamps, papel interno, organizações,
-- perfis e Row-Level Security (isolamento zero cross-tenant).

-- 1. Função partilhada para atualizar updated_at (criada antes dos triggers).
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 2. Papel interno RBAC (valores controlados por enum, nunca texto livre).
create type user_role as enum ('OWNER', 'ADMIN', 'MEMBER', 'GUEST');

-- 3. Organizações: tenant e identidade visual (white-label).
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  primary_color text not null default 'oklch(0.32 0.12 255)',
  secondary_color text not null default 'oklch(0.93 0.035 205)',
  accent_color text not null default 'oklch(0.66 0.13 180)',
  locale text not null default 'pt-PT',
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create index organizations_locale_idx on organizations (locale);

create trigger organizations_updated_at
  before update on organizations
  for each row
  execute function update_updated_at_column();

-- 4. Perfis: utilizadores autenticados vinculados a uma organização.
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  organization_id uuid references organizations on delete set null,
  role user_role not null default 'MEMBER',
  full_name text,
  avatar_url text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create index profiles_organization_id_idx on profiles (organization_id);
create index profiles_role_idx on profiles (role);

create trigger profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

-- 5. Helper seguro para a organização atual (evita recursão em políticas de perfis).
create or replace function current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from profiles where id = auth.uid();
$$;

revoke all on function current_organization_id() from public;
grant execute on function current_organization_id() to authenticated;

-- 6. Row-Level Security: sem acesso cruzado entre tenants.
alter table organizations enable row level security;
alter table profiles enable row level security;

create policy "organizations_read_own_org"
  on organizations for select
  to authenticated
  using (id = current_organization_id());

create policy "profiles_read_own_org"
  on profiles for select
  to authenticated
  using (organization_id = current_organization_id());

create policy "profiles_update_own"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- 7. Privilégios via API (PostgREST): leitura só autenticada e restrita;
-- escrita apenas por service_role (gestão de membros é fora do MVP).
grant select on organizations to authenticated;
grant select on profiles to authenticated;
grant update (full_name, avatar_url, preferences) on profiles to authenticated;
grant select, insert, update, delete on organizations, profiles to service_role;

-- 8. Documentação.
comment on function update_updated_at_column() is 'Atualiza updated_at automaticamente nas tabelas com trigger.';
comment on type user_role is 'Papel interno RBAC: OWNER, ADMIN, MEMBER, GUEST.';
comment on function current_organization_id() is 'Devolve o id da organização do utilizador autenticado (sem RLS).';
comment on table organizations is 'Agência/tenant e identidade visual (white-label).';
comment on column organizations.slug is 'Identificador único do tenant para white-label.';
comment on column organizations.locale is 'Locale da interface (pt-PT por defeito).';
comment on table profiles is 'Utilizadores autenticados com organização e papel RBAC.';
comment on column profiles.role is 'Papel interno: OWNER, ADMIN, MEMBER ou GUEST.';
comment on column profiles.preferences is 'Preferências do utilizador (JSONB).';