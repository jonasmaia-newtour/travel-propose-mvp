-- Migration: 20260820000004_adjustments
-- Pedidos de ajuste público (US3): registo append-only da observação do
-- viajante e função security definer que devolve a proposta a revisão.
-- A sessão é armazenada apenas como hash (nunca a sessão em bruto).
-- Permissões mínimas: execução por anon (o viajante não autenticado).

-- 1. Trigger partilhado de imutabilidade (append-only).
-- Permite apenas o delete em cascata a partir do pai (proposta/organização):
-- durante um cascade o trigger é invocado com pg_trigger_depth() > 1; um
-- delete direto (profundidade 1) continua bloqueado, tal como qualquer update.
create or replace function prevent_append_only_mutation()
returns trigger as $$
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;
  raise exception 'Registo imutável: alterações e eliminações não são permitidas.';
end;
$$ language plpgsql;

-- 2. Tabela de pedidos de ajuste (append-only, sem update/delete).
create table proposal_adjustment_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references organizations on delete cascade,
  proposal_id uuid not null references proposals on delete cascade,
  message text not null check (char_length(message) between 1 and 2000),
  session_hash text not null,
  requested_at timestamp with time zone not null default timezone('utc', now()),
  resolved_at timestamp with time zone
);

create index proposal_adjustment_requests_proposal_idx
  on proposal_adjustment_requests (proposal_id, requested_at);
create index proposal_adjustment_requests_tenant_idx
  on proposal_adjustment_requests (tenant_id);

create trigger proposal_adjustment_requests_no_mutation
  before update or delete on proposal_adjustment_requests
  for each row execute function prevent_append_only_mutation();

-- 3. RLS ativado sem políticas: acesso exclusivamente pela função
-- (security definer). Sem privilégios para anon/authenticated.
alter table proposal_adjustment_requests enable row level security;
revoke all on proposal_adjustment_requests from anon, authenticated;
grant select, insert, update, delete on proposal_adjustment_requests to service_role;

-- 4. Função pública de pedido de ajuste.
create or replace function request_public_adjustment(
  p_token_hash text,
  p_message text,
  p_session_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal proposals%rowtype;
begin
  if p_message is null or char_length(p_message) < 1 or char_length(p_message) > 2000 then
    return jsonb_build_object('ok', false, 'code', 'invalid_message');
  end if;

  select * into v_proposal
    from proposals
   where token_hash = p_token_hash
   limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if v_proposal.status not in ('sent', 'viewed') then
    return jsonb_build_object('ok', false, 'code', 'invalid_state');
  end if;

  if v_proposal.expires_at <= timezone('utc', now()) then
    return jsonb_build_object('ok', false, 'code', 'expired');
  end if;

  insert into proposal_adjustment_requests (tenant_id, proposal_id, message, session_hash)
  values (
    v_proposal.tenant_id,
    v_proposal.id,
    p_message,
    encode(sha256(p_session_id::bytea), 'hex')
  );

  update proposals set status = 'revision_requested' where id = v_proposal.id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function request_public_adjustment(text, text, text) from public;
grant execute on function request_public_adjustment(text, text, text) to anon, authenticated;

-- 5. Documentação.
comment on table proposal_adjustment_requests is 'Pedido de ajuste do viajante (append-only): observação e retorno a revisão.';
comment on column proposal_adjustment_requests.session_hash is 'Hash da sessão anónima do viajante (nunca a sessão em bruto).';
comment on column proposal_adjustment_requests.resolved_at is 'Data de resolução do pedido pelo Agent (opcional).';
comment on function request_public_adjustment(text, text, text) is
  'Valida token e prazo, regista a observação e devolve a proposta a revisão (revision_requested); devolve {ok:false,code} para mensagem, token, estado ou prazo inválidos.';