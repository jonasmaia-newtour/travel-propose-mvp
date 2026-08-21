-- Seed inicial do TravelPropose MVP — newtour-test
-- Fase 4: organização de demonstração e utilizadores Owner, Manager e Agent
-- com autenticação real por e-mail e palavra-passe (Supabase Auth).
--
-- Idempotente: pode ser executado várias vezes sem duplicar dados.
-- Senha de demonstração (comum aos três utilizadores): TravelPropose2026!

-- 1. Organização newtour-test (tenant e identidade visual white-label).
insert into organizations (name, slug, primary_color, secondary_color, accent_color, locale)
values (
  'newtour-test',
  'newtour-test',
  'oklch(0.32 0.12 255)',
  'oklch(0.93 0.035 205)',
  'oklch(0.66 0.13 180)',
  'pt-PT'
)
on conflict (slug) do nothing;

-- 2. Utilizadores de demonstração: perfis ligados a auth.users e auth.identities
-- para permitir login real. UUIDs fixos e documentados.
do $$
declare
  v_org_id uuid;
  v_password text := extensions.crypt('TravelPropose2026!', extensions.gen_salt('bf'));
  v_user record;
begin
  select id into v_org_id from organizations where slug = 'newtour-test';

  for v_user in
    select * from (values
      ('00000000-0000-4000-8000-000000000001'::uuid, 'owner@newtour-test.com',   'Owner User',   'OWNER'::user_role),
      ('00000000-0000-4000-8000-000000000002'::uuid, 'manager@newtour-test.com', 'Manager User', 'ADMIN'::user_role),
      ('00000000-0000-4000-8000-000000000003'::uuid, 'agent@newtour-test.com',   'Agent User',   'MEMBER'::user_role)
    ) as t(user_id, email, full_name, role)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user.user_id,
      'authenticated', 'authenticated', v_user.email,
      v_password, timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_user.full_name),
      timezone('utc', now()), timezone('utc', now()),
      '', '', '', ''
    )
    on conflict (id) do nothing;

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user.user_id, v_user.user_id::text,
      jsonb_build_object('sub', v_user.user_id, 'email', v_user.email),
      'email', timezone('utc', now()), timezone('utc', now()), timezone('utc', now())
    )
    on conflict (provider, provider_id) do nothing;

    insert into profiles (id, organization_id, role, full_name)
    values (v_user.user_id, v_org_id, v_user.role, v_user.full_name)
    on conflict (id) do nothing;
  end loop;
end $$;

-- 3. Proposta de exemplo para a landing (T054): token travelpropose-demo-2026
-- Idempotente via ON CONFLICT; expira em 30 dias a partir da execução.
insert into proposals (id, tenant_id, owner_id, title, base_amount, status, token_hash, expires_at, notes, terms_version)
values (
  '10000000-0000-4000-8000-000000000010'::uuid,
  (select id from organizations where slug = 'newtour-test'),
  '00000000-0000-4000-8000-000000000003'::uuid,
  'Viagem de exemplo — Açores',
  120000,
  'sent',
  'b294dd839f595d1181d2af5b6273100295670ef32c003c5a1e9f922aa305f0ce',
  timezone('utc', now()) + interval '30 days',
  'Condições de demonstração: proposta válida por 30 dias. Inclui alojamento e extras opcionais.',
  1
)
on conflict (id) do update set
  title = excluded.title,
  base_amount = excluded.base_amount,
  status = excluded.status,
  token_hash = excluded.token_hash,
  expires_at = excluded.expires_at,
  notes = excluded.notes,
  terms_version = excluded.terms_version,
  updated_at = timezone('utc', now());

insert into proposal_sections (id, proposal_id, title, mode, position) values
  ('10000000-0000-4000-8000-000000000011'::uuid, '10000000-0000-4000-8000-000000000010'::uuid, 'Alojamento', 'single', 0),
  ('10000000-0000-4000-8000-000000000012'::uuid, '10000000-0000-4000-8000-000000000010'::uuid, 'Extras', 'multiple', 1)
on conflict (id) do update set title = excluded.title, mode = excluded.mode, position = excluded.position;

insert into proposal_items (id, section_id, title, description, price_delta, position) values
  ('10000000-0000-4000-8000-000000000013'::uuid, '10000000-0000-4000-8000-000000000011'::uuid, 'Hotel Central', 'Quarto standard com pequeno-almoço.', 0, 0),
  ('10000000-0000-4000-8000-000000000014'::uuid, '10000000-0000-4000-8000-000000000011'::uuid, 'Hotel Premium', 'Suite com vista mar e meia-pensão.', 18000, 1),
  ('10000000-0000-4000-8000-000000000015'::uuid, '10000000-0000-4000-8000-000000000012'::uuid, 'Voo directo', 'Voo de ida e volta incluído.', 22000, 0),
  ('10000000-0000-4000-8000-000000000016'::uuid, '10000000-0000-4000-8000-000000000012'::uuid, 'Transfer privado', 'Transfers aeroporto-hotel.', 4000, 1)
on conflict (id) do update set title = excluded.title, description = excluded.description, price_delta = excluded.price_delta, position = excluded.position;

comment on seed is 'Demonstração: newtour-test com Owner (OWNER), Manager (ADMIN) e Agent (MEMBER); proposta de exemplo travelpropose-demo-2026.';
