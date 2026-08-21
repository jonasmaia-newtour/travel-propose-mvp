-- Migration: 20260820000008_telemetry
-- Telemetria mínima (US2/US3): eventos append-only de abertura e alteração
-- de seleção. Apenas sessão anonimizada (hash), dispositivo e país opcionais;
-- nunca IP em bruto, cookies de terceiros ou PII. Acesso exclusivamente via
-- função security definer; tabela sem leitura direta por anon/authenticated.

-- 1. Tabela de eventos (append-only).
create table proposal_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references organizations on delete cascade,
  proposal_id uuid not null references proposals on delete cascade,
  type text not null check (type in ('opened', 'selection_changed')),
  session_hash text not null,
  device text check (char_length(device) between 1 and 50),
  country text check (char_length(country) = 2),
  payload jsonb,
  created_at timestamp with time zone not null default timezone('utc', now())
);

create index proposal_events_proposal_idx on proposal_events (proposal_id, created_at);
create index proposal_events_tenant_idx on proposal_events (tenant_id);
create index proposal_events_type_idx on proposal_events (tenant_id, type);

create trigger proposal_events_no_mutation
  before update or delete on proposal_events
  for each row execute function prevent_append_only_mutation();

-- 2. RLS ativado sem políticas: acesso exclusivamente pela função.
alter table proposal_events enable row level security;
revoke all on proposal_events from anon, authenticated;
grant select, insert, update, delete on proposal_events to service_role;

-- 3. Função pública de registo de evento.
create or replace function record_proposal_event(
  p_token_hash text,
  p_type text,
  p_session_id text,
  p_payload jsonb,
  p_device text,
  p_country text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal proposals%rowtype;
begin
  if p_type not in ('opened', 'selection_changed') then
    return jsonb_build_object('ok', false, 'code', 'invalid_type');
  end if;

  if p_session_id is null or char_length(p_session_id) < 8 or char_length(p_session_id) > 200 then
    return jsonb_build_object('ok', false, 'code', 'invalid_session');
  end if;

  select * into v_proposal from proposals where token_hash = p_token_hash limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if v_proposal.status not in ('sent', 'viewed') then
    return jsonb_build_object('ok', false, 'code', 'invalid_state');
  end if;

  if v_proposal.expires_at <= timezone('utc', now()) then
    return jsonb_build_object('ok', false, 'code', 'expired');
  end if;

  insert into proposal_events (tenant_id, proposal_id, type, session_hash, device, country, payload)
  values (
    v_proposal.tenant_id,
    v_proposal.id,
    p_type,
    encode(sha256(p_session_id::bytea), 'hex'),
    nullif(p_device, ''),
    nullif(p_country, ''),
    p_payload
  );

  if v_proposal.status = 'sent' then
    update proposals set status = 'viewed' where id = v_proposal.id;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function record_proposal_event(text, text, text, jsonb, text, text) from public;
grant execute on function record_proposal_event(text, text, text, jsonb, text, text) to anon, authenticated;

-- 4. Documentação.
comment on table proposal_events is 'Telemetria append-only de propostas (opened, selection_changed): sessão anonimizada, sem PII.';
comment on column proposal_events.session_hash is 'Hash da sessão anónima (nunca a sessão em bruto).';
comment on column proposal_events.payload is 'Payload limitado (seleção por posições) para selection_changed; nulo para opened.';
comment on function record_proposal_event(text, text, text, jsonb, text, text) is 'Valida token e prazo, regista o evento com hash da sessão e marca a proposta como viewed quando vem de sent.';
