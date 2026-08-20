/**
 * Suporte partilhado dos testes de integração da Fase 9 (ajuste e aceite).
 *
 * Requisitos: ambiente Supabase acessível com as migrações 001-005 aplicadas e
 * variáveis de ambiente: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * (anon) e SUPABASE_SECRET_KEY (service_role, apenas para configuração e limpeza).
 * Usa fetch direto ao PostgREST/GoTrue para testar o contrato real da API.
 */
import { createHash } from 'node:crypto';

export const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const SECRET = process.env.SUPABASE_SECRET_KEY;
export const hasConfig = Boolean(URL && ANON && SECRET);

export const TEST_PASSWORD = 'phase9-integration-password-2026';

export function endpoint(path: string): string {
  return `${URL}${path}`;
}

export function headers(key: string, token?: string): Record<string, string> {
  return {
    apikey: key,
    Authorization: `Bearer ${token ?? key}`,
    'Content-Type': 'application/json',
  };
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export async function rpc(
  name: string,
  body: Record<string, unknown>
): Promise<{ status: number; data: unknown }> {
  const response = await fetch(endpoint(`/rest/v1/rpc/${name}`), {
    method: 'POST',
    headers: headers(ANON as string),
    body: JSON.stringify(body),
  });
  const data = response.status === 204 ? null : await response.json();
  return { status: response.status, data };
}

type Json = Record<string, unknown>;

export async function createOrg(slug: string): Promise<string> {
  const response = await fetch(endpoint('/rest/v1/organizations'), {
    method: 'POST',
    headers: { ...headers(SECRET as string), Prefer: 'return=representation' },
    body: JSON.stringify({ name: slug, slug }),
  });
  if (!response.ok) throw new Error(`Criar organização falhou: ${response.status}`);
  const rows = (await response.json()) as Array<{ id: string }>;
  return rows[0].id;
}

export async function deleteOrg(slug: string): Promise<void> {
  await fetch(endpoint(`/rest/v1/organizations?slug=eq.${slug}`), {
    method: 'DELETE',
    headers: headers(SECRET as string),
  });
}

export async function createUser(email: string): Promise<string> {
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

export async function deleteUserByEmail(email: string): Promise<void> {
  const response = await fetch(endpoint('/auth/v1/admin/users?per_page=1000'), {
    headers: headers(SECRET as string),
  });
  if (!response.ok) throw new Error(`Lista de utilizadores falhou: ${response.status}`);
  const json = (await response.json()) as { users: Array<{ id: string; email: string }> };
  const matches = json.users.filter((u) => u.email === email);
  for (const user of matches) {
    const del = await fetch(endpoint(`/auth/v1/admin/users/${user.id}`), {
      method: 'DELETE',
      headers: headers(SECRET as string),
    });
    if (!del.ok && del.status !== 404) throw new Error(`Delete utilizador falhou: ${del.status}`);
  }
}

export async function linkProfile(userId: string, orgId: string): Promise<void> {
  const response = await fetch(endpoint('/rest/v1/profiles'), {
    method: 'POST',
    headers: headers(SECRET as string),
    body: JSON.stringify({ id: userId, organization_id: orgId, role: 'OWNER', full_name: userId }),
  });
  if (!response.ok) throw new Error(`Criar perfil falhou: ${response.status}`);
}

export async function insertProposal(
  orgId: string,
  ownerId: string,
  fields: { tokenHash: string; status: string; expiresAt: string; baseAmount?: number }
): Promise<string> {
  const response = await fetch(endpoint('/rest/v1/proposals'), {
    method: 'POST',
    headers: { ...headers(SECRET as string), Prefer: 'return=representation' },
    body: JSON.stringify({
      tenant_id: orgId,
      owner_id: ownerId,
      title: 'Proposta de integração',
      base_amount: fields.baseAmount ?? 100000,
      status: fields.status,
      token_hash: fields.tokenHash,
      expires_at: fields.expiresAt,
      notes: 'Condições de teste: pagamento a 30 dias.',
    }),
  });
  if (!response.ok) throw new Error(`Criar proposta falhou: ${response.status}`);
  const rows = (await response.json()) as Array<{ id: string }>;
  return rows[0].id;
}

export async function insertSection(
  proposalId: string,
  title: string,
  mode: string,
  position: number
): Promise<string> {
  const response = await fetch(endpoint('/rest/v1/proposal_sections'), {
    method: 'POST',
    headers: { ...headers(SECRET as string), Prefer: 'return=representation' },
    body: JSON.stringify({ proposal_id: proposalId, title, mode, position }),
  });
  if (!response.ok) throw new Error(`Criar secção falhou: ${response.status}`);
  const rows = (await response.json()) as Array<{ id: string }>;
  return rows[0].id;
}

export async function insertItem(
  sectionId: string,
  title: string,
  priceDelta: number,
  position: number
): Promise<void> {
  const response = await fetch(endpoint('/rest/v1/proposal_items'), {
    method: 'POST',
    headers: headers(SECRET as string),
    body: JSON.stringify({ section_id: sectionId, title, price_delta: priceDelta, position }),
  });
  if (!response.ok) throw new Error(`Criar item falhou: ${response.status}`);
}

export async function selectRows(table: string, query: string): Promise<Json[]> {
  const response = await fetch(endpoint(`/rest/v1/${table}?${query}`), {
    headers: headers(SECRET as string),
  });
  if (!response.ok) throw new Error(`Select ${table} falhou: ${response.status}`);
  return (await response.json()) as Json[];
}

export function futureIso(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}