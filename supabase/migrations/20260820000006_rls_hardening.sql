-- Migration: 20260820000006_rls_hardening
-- Corrige a higiene de privilégios exposta pelos testes de integração:
-- (1) o Supabase concede por defeito privilégios totais a anon/authenticated
-- em tabelas novas; (2) a policy profiles_update_own permitia escalar o
-- próprio papel. Revoga-se o acesso direto desnecessário e restringe-se a
-- atualização do perfil ao próprio, sem alterar papel nem organização.

-- 1. Helper seguro do papel atual (sem RLS), espelhando current_organization_id.
create or replace function current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

revoke all on function current_user_role() from public;
grant execute on function current_user_role() to authenticated;

-- 2. Privilégios explícitos: remover os grants default e repor apenas os
-- intencionais. anon nunca acede a tabelas diretamente (só funções).
revoke all on organizations, profiles, proposals, proposal_sections, proposal_items from anon;
revoke all on organizations, profiles, proposals, proposal_sections, proposal_items from authenticated;

grant select on organizations to authenticated;
grant select on profiles to authenticated;
grant update (full_name, avatar_url, preferences) on profiles to authenticated;
grant select, insert, update, delete on proposals, proposal_sections, proposal_items to authenticated;
grant select, insert, update, delete on organizations, profiles, proposals, proposal_sections, proposal_items to service_role;

-- 3. Default privileges: tabelas futuras em public não herdam grants a
-- anon/authenticated; cada migração concede explicitamente o necessário.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on tables from authenticated;
alter default privileges in schema public grant all on tables to service_role;

-- 4. Endurecer a atualização do perfil: o utilizador só pode atualizar o
-- próprio registo e nunca mudar papel nem organização (com check).
drop policy profiles_update_own on profiles;

create policy profiles_update_own
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = current_user_role()
    and organization_id = current_organization_id()
  );

-- 5. Documentação.
comment on function current_user_role() is 'Devolve o papel interno do utilizador autenticado (sem RLS).';
comment on policy profiles_update_own on profiles is 'Atualização apenas do próprio perfil, sem alterar papel nem organização.';