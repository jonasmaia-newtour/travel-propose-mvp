-- Migration: 20260820000005_approval
-- Aceite transacional (US2): snapshot imutável e função security definer que
-- valida prazo, estado, termos e seleção e congela valores numa única
-- transação. Apenas um aceite por proposta (row lock + unique).
-- Permissões mínimas: execução por anon (o viajante não autenticado).

-- 1. Extensões da proposta: versão dos termos e instante de aprovação.
alter table proposals add column terms_version integer not null default 1;
alter table proposals add column approved_at timestamp with time zone;

-- 2. Tabela de snapshots (imutável, um por proposta, sem update/delete).
create table proposal_approval_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references organizations on delete cascade,
  proposal_id uuid not null unique references proposals on delete cascade,
  snapshot jsonb not null,
  terms_version integer not null,
  session_hash text not null,
  created_at timestamp with time zone not null default timezone('utc', now())
);

create index proposal_approval_snapshots_tenant_idx
  on proposal_approval_snapshots (tenant_id);

create trigger proposal_approval_snapshots_no_mutation
  before update or delete on proposal_approval_snapshots
  for each row execute function prevent_append_only_mutation();

alter table proposal_approval_snapshots enable row level security;
revoke all on proposal_approval_snapshots from anon, authenticated;
grant select, insert, update, delete on proposal_approval_snapshots to service_role;

-- 3. Função transacional de aceite. A seleção é um JSON de arrays de
-- posições de item (índices da representação pública, por secção na ordem
-- de posição) — PostgREST não aceita integer[][] com sub-arrays de tamanhos
-- diferentes; jsonb preserva a forma irregular da seleção.
create or replace function approve_public_proposal(
  p_token_hash text,
  p_selection jsonb,
  p_terms_version integer,
  p_terms_accepted boolean,
  p_session_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal proposals%rowtype;
  v_section record;
  v_section_count integer;
  v_selected jsonb;
  v_val integer;
  v_seen integer[] := '{}'::integer[];
  v_item_count integer;
  v_item_title text;
  v_item_delta integer;
  v_total integer;
  v_selected_items jsonb := '[]'::jsonb;
  v_snapshot_id uuid;
  v_approved_at timestamp with time zone;
begin
  select * into v_proposal
    from proposals
   where token_hash = p_token_hash
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if v_proposal.status not in ('sent', 'viewed') then
    return jsonb_build_object('ok', false, 'code', 'invalid_state');
  end if;

  if v_proposal.expires_at <= timezone('utc', now()) then
    return jsonb_build_object('ok', false, 'code', 'expired');
  end if;

  if p_terms_accepted is not true then
    return jsonb_build_object('ok', false, 'code', 'terms_required');
  end if;

  if p_terms_version is distinct from v_proposal.terms_version then
    return jsonb_build_object('ok', false, 'code', 'terms_version_mismatch');
  end if;

  if jsonb_typeof(p_selection) <> 'array' then
    return jsonb_build_object('ok', false, 'code', 'invalid_selection');
  end if;

  select count(*) into v_section_count
    from proposal_sections
   where proposal_id = v_proposal.id;

  if jsonb_array_length(p_selection) <> v_section_count then
    return jsonb_build_object('ok', false, 'code', 'invalid_selection');
  end if;

  v_total := v_proposal.base_amount;

  for v_section in
    select id, title, mode, position
      from proposal_sections
     where proposal_id = v_proposal.id
     order by position
  loop
    v_selected := p_selection -> (v_section.position);

    if jsonb_typeof(v_selected) <> 'array' then
      return jsonb_build_object('ok', false, 'code', 'invalid_selection');
    end if;

    if v_section.mode = 'single' and jsonb_array_length(v_selected) <> 1 then
      return jsonb_build_object('ok', false, 'code', 'invalid_selection');
    end if;

    select count(*) into v_item_count
      from proposal_items
     where section_id = v_section.id;

    v_seen := '{}'::integer[];

    for v_val in
      select (jsonb_array_elements_text(v_selected))::integer
    loop
      if v_val < 0 or v_val >= v_item_count then
        return jsonb_build_object('ok', false, 'code', 'invalid_selection');
      end if;
      if v_val = any(v_seen) then
        return jsonb_build_object('ok', false, 'code', 'invalid_selection');
      end if;
      v_seen := array_append(v_seen, v_val);

      select title, price_delta into v_item_title, v_item_delta
        from proposal_items
       where section_id = v_section.id and position = v_val;

      v_total := v_total + v_item_delta;
      v_selected_items := v_selected_items || jsonb_build_array(jsonb_build_object(
        'section_title', v_section.title,
        'item_title', v_item_title,
        'price_delta', v_item_delta
      ));
    end loop;
  end loop;

  v_approved_at := timezone('utc', now());

  insert into proposal_approval_snapshots (
    tenant_id, proposal_id, snapshot, terms_version, session_hash
  ) values (
    v_proposal.tenant_id,
    v_proposal.id,
    jsonb_build_object(
      'title', v_proposal.title,
      'currency', 'EUR',
      'base_amount', v_proposal.base_amount,
      'total', v_total,
      'terms_version', v_proposal.terms_version,
      'expires_at', v_proposal.expires_at,
      'selected_items', v_selected_items
    ),
    v_proposal.terms_version,
    encode(sha256(p_session_id::bytea), 'hex')
  )
  returning id into v_snapshot_id;

  update proposals
     set status = 'approved', approved_at = v_approved_at
   where id = v_proposal.id;

  return jsonb_build_object(
    'ok', true,
    'receipt', jsonb_build_object(
      'id', v_snapshot_id,
      'approved_at', v_approved_at,
      'currency', 'EUR',
      'base_amount', v_proposal.base_amount,
      'total', v_total,
      'terms_version', v_proposal.terms_version,
      'items', v_selected_items
    )
  );
end;
$$;

revoke all on function approve_public_proposal(text, jsonb, integer, boolean, text) from public;
grant execute on function approve_public_proposal(text, jsonb, integer, boolean, text) to anon, authenticated;

-- 4. Documentação.
comment on column proposals.terms_version is 'Versão dos termos: incrementa a cada republicação para invalidar aceites com seleção antiga.';
comment on column proposals.approved_at is 'Instante do aceite (estado approved).';
comment on table proposal_approval_snapshots is 'Snapshot imutável do aceite (um por proposta).';
comment on column proposal_approval_snapshots.snapshot is 'Valores congelados: título, moeda, base, total, termos e itens selecionados.';
comment on function approve_public_proposal(text, jsonb, integer, boolean, text) is
  'Aceite transacional: valida token, estado, prazo, termos e seleção, grava o snapshot e aprova a proposta numa única operação.';