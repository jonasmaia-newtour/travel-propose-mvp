/**
 * Teste de integração do isolamento multi-tenant via Row-Level Security (RLS).
 *
 * Requisitos: ambiente Supabase acessível (local via `supabase db start` ou projeto
 * de teste) com a migração de identidade aplicada, e variáveis de ambiente:
 * NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (anon) e
 * SUPABASE_SECRET_KEY (service_role, apenas para configuração e limpeza).
 *
 * Usa fetch direto ao PostgREST/GoTrue para testar o contrato real da API.
 * Sem configuração a suíte é ignorada (skip). Executar com npm.cmd run test:integration.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY;

const hasConfig = Boolean(URL && ANON && SECRET);

const TEST_PASSWORD = 'isolation-test-password-2026';
const EMAIL_A = 'isolation.owner.a@test.local';
const EMAIL_B = 'isolation.owner.b@test.local';
const ORG_A = 'isolation-tenant-a';
const ORG_B = 'isolation-tenant-b';

type OrgRow = { id: string; slug: string };
type ProfileRow = { id: string; role: string; organization_id: string | null };

function endpoint(path: string): string {
  return `${URL}${path}`;
}

function headers(key: string, token?: string): Record<string, string> {
  return {
    apikey: key,
    Authorization: `Bearer ${token ?? key}`,
    'Content-Type': 'application/json',
  };
}

async function authHeader(email: string): Promise<string> {
  const response = await fetch(
    endpoint(`/auth/v1/token?grant_type=password`),
    {
      method: 'POST',
      headers: headers(ANON as string),
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    }
  );
  if (!response.ok) throw new Error(`Login falhou para ${email}: ${response.status}`);
  const json = (await response.json()) as { access_token: string };
  return json.access_token;
}

async function selectOrgs(token: string): Promise<OrgRow[]> {
  const response = await fetch(
    endpoint(`/rest/v1/organizations?select=id,slug&order=slug.asc`),
    { headers: headers(ANON as string, token) }
  );
  if (!response.ok) throw new Error(`Select organizações falhou: ${response.status}`);
  return (await response.json()) as OrgRow[];
}

async function selectProfiles(token: string, orgId: string): Promise<ProfileRow[]> {
  const response = await fetch(
    endpoint(`/rest/v1/profiles?select=id,role,organization_id&organization_id=eq.${orgId}`),
    { headers: headers(ANON as string, token) }
  );
  if (!response.ok) throw new Error(`Select perfis falhou: ${response.status}`);
  return (await response.json()) as ProfileRow[];
}

async function deleteUsers(): Promise<void> {
  const response = await fetch(endpoint('/auth/v1/admin/users?per_page=1000'), {
    headers: headers(SECRET as string),
  });
  if (!response.ok) throw new Error(`Lista de utilizadores falhou: ${response.status}`);
  const json = (await response.json()) as { users: Array<{ id: string; email: string }> };
  const matches = json.users.filter((u) => u.email === EMAIL_A || u.email === EMAIL_B);
  await Promise.all(
    matches.map(async (u) => {
      const del = await fetch(endpoint(`/auth/v1/admin/users/${u.id}`), {
        method: 'DELETE',
        headers: headers(SECRET as string),
      });
      if (!del.ok && del.status !== 404) throw new Error(`Delete utilizador falhou: ${del.status}`);
    })
  );
}

describe.skipIf(!hasConfig)('isolamento multi-tenant (RLS)', () => {
  let orgAId: string;
  let orgBId: string;
  let userAId: string;
  let userAToken: string;

  async function createOrg(slug: string): Promise<string> {
    const response = await fetch(endpoint('/rest/v1/organizations'), {
      method: 'POST',
      headers: { ...headers(SECRET as string), Prefer: 'return=representation' },
      body: JSON.stringify({ name: slug, slug }),
    });
    if (!response.ok) throw new Error(`Criar organização falhou: ${response.status}`);
    const rows = (await response.json()) as OrgRow[];
    return rows[0].id;
  }

  async function createUser(email: string): Promise<string> {
    const response = await fetch(endpoint('/auth/v1/admin/users'), {
      method: 'POST',
      headers: headers(SECRET as string),
      body: JSON.stringify({
        email,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: email },
      }),
    });
    if (!response.ok) throw new Error(`Criar utilizador falhou: ${response.status}`);
    const json = (await response.json()) as { id: string };
    return json.id;
  }

  async function linkProfile(id: string, orgId: string): Promise<void> {
    const response = await fetch(endpoint('/rest/v1/profiles'), {
      method: 'POST',
      headers: headers(SECRET as string),
      body: JSON.stringify({ id, organization_id: orgId, role: 'OWNER', full_name: id }),
    });
    if (!response.ok) throw new Error(`Criar perfil falhou: ${response.status}`);
  }

  beforeAll(async () => {
    if (!URL || !ANON || !SECRET) return;

    await deleteUsers();
    for (const slug of [ORG_A, ORG_B]) {
      await fetch(endpoint(`/rest/v1/organizations?slug=eq.${slug}`), {
        method: 'DELETE',
        headers: headers(SECRET),
      });
    }

    orgAId = await createOrg(ORG_A);
    orgBId = await createOrg(ORG_B);

    userAId = await createUser(EMAIL_A);
    const userBId = await createUser(EMAIL_B);

    await linkProfile(userAId, orgAId);
    await linkProfile(userBId, orgBId);

    userAToken = await authHeader(EMAIL_A);
  });

  afterAll(async () => {
    if (!URL || !ANON || !SECRET) return;
    await deleteUsers();
    for (const slug of [ORG_A, ORG_B]) {
      await fetch(endpoint(`/rest/v1/organizations?slug=eq.${slug}`), {
        method: 'DELETE',
        headers: headers(SECRET),
      });
    }
  });

  it('anónimo não consegue ler organizações', async () => {
    const response = await fetch(endpoint('/rest/v1/organizations?select=id'), {
      headers: headers(ANON as string),
    });
    expect(response.status).toBe(401);
  });

  it('um utilizador vê apenas a sua organização', async () => {
    const rows = await selectOrgs(userAToken);
    expect(rows.map((o) => o.id)).toEqual([orgAId]);
  });

  it('um utilizador não vê perfis de outra organização', async () => {
    const own = await selectProfiles(userAToken, orgAId);
    expect(own.map((p) => p.id)).toContain(userAId);

    const foreign = await selectProfiles(userAToken, orgBId);
    expect(foreign).toHaveLength(0);
  });

  it('um utilizador não pode criar perfil noutra organização', async () => {
    const response = await fetch(endpoint('/rest/v1/profiles'), {
      method: 'POST',
      headers: headers(ANON as string, userAToken),
      body: JSON.stringify({ id: randomUUID(), organization_id: orgBId, role: 'MEMBER' }),
    });
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('um utilizador não pode escalar o próprio papel', async () => {
    const response = await fetch(endpoint(`/rest/v1/profiles?id=eq.${userAId}`), {
      method: 'PATCH',
      headers: headers(ANON as string, userAToken),
      body: JSON.stringify({ role: 'OWNER' }),
    });
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('um utilizador não pode mudar a sua organização', async () => {
    const response = await fetch(endpoint(`/rest/v1/profiles?id=eq.${userAId}`), {
      method: 'PATCH',
      headers: headers(ANON as string, userAToken),
      body: JSON.stringify({ organization_id: orgBId }),
    });
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});