-- Migration: 20260819000002_proposals
-- Domínio de propostas: metadados, secções de escolha, itens, estados e RLS
-- multi-tenant. Valores monetários em cêntimos (inteiros).

-- 1. Estados e modos controlados por enum (nunca texto livre).
create type proposal_status as enum (
  'draft', 'sent', 'viewed', 'revision_requested', 'approved', 'expired'
);
create type proposal_section_mode as enum ('single', 'multiple');

-- 2. Propostas: metadados, proprietário, token e validade.
create table proposals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references organizations on delete cascade,
  owner_id uuid not null references profiles on delete restrict,
  title text not null default '',
  base_amount integer not null default 0 check (base_amount >= 0),
  status proposal_status not null default 'draft',
  token_hash text unique,
  expires_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create index proposals_tenant_status_idx on proposals (tenant_id, status);
create index proposals_owner_status_idx on proposals (owner_id, status);

create trigger proposals_updated_at
  before update on proposals
  for each row
  execute function update_updated_at_column();

-- 3. Secções: blocos ordenados de escolha única ou múltipla.
create table proposal_sections (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals on delete cascade,
  title text not null,
  mode proposal_section_mode not null default 'single',
  position integer not null default 0 check (position >= 0),
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create index proposal_sections_proposal_position_idx
  on proposal_sections (proposal_id, position);

create trigger proposal_sections_updated_at
  before update on proposal_sections
  for each row
  execute function update_updated_at_column();

-- 4. Itens: cópia independente com variação de preço sobre o valor base.
create table proposal_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references proposal_sections on delete cascade,
  title text not null,
  description text,
  image_url text,
  price_delta integer not null default 0,
  position integer not null default 0 check (position >= 0),
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create index proposal_items_section_position_idx
  on proposal_items (section_id, position);

create trigger proposal_items_updated_at
  before update on proposal_items
  for each row
  execute function update_updated_at_column();

-- 5. Row-Level Security: isolamento por tenant; o agent gere as próprias
-- propostas e OWNER/ADMIN acedem a toda a organização.
alter table proposals enable row level security;
alter table proposal_sections enable row level security;
alter table proposal_items enable row level security;

create policy "proposals_read_own_org"
  on proposals for select
  to authenticated
  using (tenant_id = current_organization_id());

create policy "proposals_insert_own"
  on proposals for insert
  to authenticated
  with check (tenant_id = current_organization_id() and owner_id = auth.uid());

create policy "proposals_update_own_org"
  on proposals for update
  to authenticated
  using (
    tenant_id = current_organization_id()
    and (
      owner_id = auth.uid()
      or exists (
        select 1 from profiles p
        where p.id = auth.uid()
          and p.organization_id = tenant_id
          and p.role in ('OWNER', 'ADMIN')
      )
    )
  );

create policy "proposals_delete_own"
  on proposals for delete
  to authenticated
  using (
    tenant_id = current_organization_id()
    and owner_id = auth.uid()
    and status = 'draft'
  );

create policy "sections_read_own_org"
  on proposal_sections for select
  to authenticated
  using (
    exists (
      select 1 from proposals p
      where p.id = proposal_id and p.tenant_id = current_organization_id()
    )
  );

create policy "sections_insert_own"
  on proposal_sections for insert
  to authenticated
  with check (
    exists (
      select 1 from proposals p
      where p.id = proposal_id
        and p.tenant_id = current_organization_id()
        and p.owner_id = auth.uid()
    )
  );

create policy "sections_update_delete_own"
  on proposal_sections for update
  to authenticated
  using (
    exists (
      select 1 from proposals p
      where p.id = proposal_id and p.tenant_id = current_organization_id()
    )
  );

create policy "items_read_own_org"
  on proposal_items for select
  to authenticated
  using (
    exists (
      select 1 from proposal_sections s
      join proposals p on p.id = s.proposal_id
      where s.id = section_id and p.tenant_id = current_organization_id()
    )
  );

create policy "items_insert_own"
  on proposal_items for insert
  to authenticated
  with check (
    exists (
      select 1 from proposal_sections s
      join proposals p on p.id = s.proposal_id
      where s.id = section_id
        and p.tenant_id = current_organization_id()
        and p.owner_id = auth.uid()
    )
  );

create policy "items_update_delete_own"
  on proposal_items for update
  to authenticated
  using (
    exists (
      select 1 from proposal_sections s
      join proposals p on p.id = s.proposal_id
      where s.id = section_id and p.tenant_id = current_organization_id()
    )
  );

-- 6. Privilégios via API (PostgREST): escrita autenticada restrita por RLS;
-- service_role mantém acesso total para operações de sistema.
grant select, insert, update, delete on proposals to authenticated;
grant select, insert, update, delete on proposal_sections to authenticated;
grant select, insert, update, delete on proposal_items to authenticated;
grant select, insert, update, delete on proposals, proposal_sections, proposal_items to service_role;

-- 7. Documentação.
comment on type proposal_status is 'Estado da proposta: draft, sent, viewed, revision_requested, approved, expired.';
comment on type proposal_section_mode is 'Modo de escolha: single (um item) ou multiple (zero ou mais).';
comment on table proposals is 'Proposta da agência com estado, token e validade.';
comment on column proposals.tenant_id is 'Organização proprietária (isolamento RLS).';
comment on column proposals.owner_id is 'Agent que criou a proposta (criação e edição).';
comment on column proposals.base_amount is 'Valor base em cêntimos.';
comment on column proposals.token_hash is 'Hash do token público de acesso do viajante (nunca o token).';
comment on table proposal_sections is 'Bloco ordenado de escolha única ou múltipla.';
comment on column proposal_sections.position is 'Ordem da secção dentro da proposta.';
comment on table proposal_items is 'Item selecionável com variação de preço sobre o valor base.';
comment on column proposal_items.price_delta is 'Variação em cêntimos sobre o valor base (pode ser negativa).';