-- Migration: 20260820000007_public_terms
-- Expõe a versão dos termos na representação pública (T045).
-- O viajante devolve terms_version no POST /approval; cada republicação
-- incrementa a versão e invalida aceites baseados numa versão anterior.
-- Atualiza get_public_proposal (criada em 003) sem alterar a assinatura.

-- 1. Re-criação da função de leitura pública com terms_version.
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
    'terms_version', v_proposal.terms_version,
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

-- 2. Permissões mantidas: apenas execução, nunca leitura direta às tabelas.
revoke all on function get_public_proposal(text) from public;
grant execute on function get_public_proposal(text) to anon, authenticated;

-- 3. Documentação.
comment on function get_public_proposal(text) is
  'Devolve a representação pública de uma proposta válida (sent/viewed e não expirada) dado o hash do token, incluindo a versão dos termos; devolve null para token inválido, expirado ou inexistente.';