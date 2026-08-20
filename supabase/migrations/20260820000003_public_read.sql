-- Migration: 20260820000003_public_read
-- Leitura pública de propostas: função security definer que valida o hash do
-- token e devolve apenas a representação pública (sem IDs internos,
-- tenant_id, dados de utilizadores ou hashes). A moeda é fixa em EUR no MVP.
-- Permissões mínimas: execução por anon (o viajante não autenticado).

-- 1. Função de leitura pública.
create or replace function get_public_proposal(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal proposals%rowtype;
  v_org organizations%rowtype;
  v_sections jsonb;
begin
  select * into v_proposal
    from proposals
   where token_hash = p_token_hash
     and status in ('sent', 'viewed')
     and expires_at > timezone('utc', now())
   limit 1;

  if not found then
    return null;
  end if;

  select * into v_org from organizations where id = v_proposal.tenant_id;

  select jsonb_agg(
    jsonb_build_object(
      'title', s.title,
      'mode', s.mode,
      'position', s.position,
      'items', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'title', i.title,
            'description', i.description,
            'image_url', i.image_url,
            'price_delta', i.price_delta,
            'position', i.position
          ) order by i.position
        )
        from proposal_items i
        where i.section_id = s.id
      ), '[]'::jsonb)
    ) order by s.position
  ) into v_sections
  from proposal_sections s
  where s.proposal_id = v_proposal.id;

  return jsonb_build_object(
    'title', v_proposal.title,
    'base_amount', v_proposal.base_amount,
    'notes', v_proposal.notes,
    'expires_at', v_proposal.expires_at,
    'agency', jsonb_build_object(
      'name', v_org.name,
      'logo_url', v_org.logo_url
    ),
    'sections', coalesce(v_sections, '[]'::jsonb)
  );
end;
$$;

-- 2. Permissões mínimas: apenas execução, nunca leitura direta às tabelas.
revoke all on function get_public_proposal(text) from public;
grant execute on function get_public_proposal(text) to anon, authenticated;

-- 3. Documentação.
comment on function get_public_proposal(text) is
  'Devolve a representação pública de uma proposta válida (sent/viewed e não expirada) dado o hash do token; devolve null para token inválido, expirado ou inexistente.';