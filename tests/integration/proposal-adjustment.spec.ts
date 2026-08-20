/**
 * Testes de integração do pedido de ajuste público (US3, T041).
 * Cobrem o contrato de request_public_adjustment: registo append-only da
 * observação, devolução da proposta a revisão, recusa por token inválido,
 * estado terminal ou expiração, validação da mensagem e privacidade da sessão.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ANON,
  URL,
  createOrg,
  createUser,
  deleteOrg,
  deleteUserByEmail,
  endpoint,
  futureIso,
  hasConfig,
  headers,
  insertItem,
  insertProposal,
  insertSection,
  linkProfile,
  rpc,
  selectRows,
  sha256Hex,
} from './support';

const ORG_SLUG = 'adjustment-test-tenant';
const OWNER_EMAIL = 'adjustment.owner@test.local';
const VALID_TOKEN = 'adjustment-valid-token';
const BOUNDARY_TOKEN = 'adjustment-boundary-token';
const EXPIRED_TOKEN = 'adjustment-expired-token';
const APPROVED_TOKEN = 'adjustment-approved-token';
const UNKNOWN_TOKEN = 'adjustment-unknown-token';

type RpcResult = { ok: boolean; code?: string };
type AdjustmentRow = {
  id: string;
  tenant_id: string;
  proposal_id: string;
  message: string;
  session_hash: string;
  requested_at: string;
  resolved_at: string | null;
};
type ProposalRow = { id: string; status: string };

describe.skipIf(!hasConfig)('pedido de ajuste público', () => {
  let orgId: string;
  let ownerId: string;
  let validProposalId: string;
  let boundaryProposalId: string;

  async function buildProposal(token: string, status: string, expiresInDays: number): Promise<string> {
    const proposalId = await insertProposal(orgId, ownerId, {
      tokenHash: sha256Hex(token),
      status,
      expiresAt: futureIso(expiresInDays),
    });
    const sectionId = await insertSection(proposalId, 'Alojamento', 'single', 0);
    await insertItem(sectionId, 'Standard', 0, 0);
    await insertItem(sectionId, 'Premium', 5000, 1);
    return proposalId;
  }

  beforeAll(async () => {
    if (!URL || !ANON || !hasConfig) return;
    await deleteOrg(ORG_SLUG);
    await deleteUserByEmail(OWNER_EMAIL);

    orgId = await createOrg(ORG_SLUG);
    ownerId = await createUser(OWNER_EMAIL);
    await linkProfile(ownerId, orgId);

    validProposalId = await buildProposal(VALID_TOKEN, 'sent', 1);
    boundaryProposalId = await buildProposal(BOUNDARY_TOKEN, 'sent', 1);
    await buildProposal(EXPIRED_TOKEN, 'sent', -1);
    await buildProposal(APPROVED_TOKEN, 'approved', 1);
  });

  afterAll(async () => {
    if (!URL || !ANON || !hasConfig) return;
    await deleteOrg(ORG_SLUG);
    await deleteUserByEmail(OWNER_EMAIL);
  });

  async function requestAdjustment(token: string, message: string): Promise<RpcResult> {
    const result = await rpc('request_public_adjustment', {
      p_token_hash: sha256Hex(token),
      p_message: message,
      p_session_id: 'sess-adj-1',
    });
    expect(result.status).toBe(200);
    return result.data as RpcResult;
  }

  it('regista a observação e devolve a proposta a revisão', async () => {
    const result = await requestAdjustment(VALID_TOKEN, 'Gostaria de trocar o hotel por uma opção mais económica.');
    expect(result).toEqual({ ok: true });

    const proposals = (await selectRows(
      'proposals',
      `id=eq.${validProposalId}&select=id,status`
    )) as ProposalRow[];
    expect(proposals).toHaveLength(1);
    expect(proposals[0].status).toBe('revision_requested');

    const adjustments = (await selectRows(
      'proposal_adjustment_requests',
      `proposal_id=eq.${validProposalId}&select=id,tenant_id,proposal_id,message,session_hash,requested_at,resolved_at`
    )) as AdjustmentRow[];
    expect(adjustments).toHaveLength(1);
    expect(adjustments[0].tenant_id).toBe(orgId);
    expect(adjustments[0].proposal_id).toBe(validProposalId);
    expect(adjustments[0].message).toBe(
      'Gostaria de trocar o hotel por uma opção mais económica.'
    );
    expect(adjustments[0].resolved_at).toBeNull();
    expect(adjustments[0].requested_at).toBeTruthy();
  });

  it('armazena apenas o hash da sessão, nunca a sessão em bruto', async () => {
    const adjustments = (await selectRows(
      'proposal_adjustment_requests',
      `proposal_id=eq.${validProposalId}&select=session_hash`
    )) as Array<{ session_hash: string }>;
    expect(adjustments[0].session_hash).toBe(sha256Hex('sess-adj-1'));
    expect(adjustments[0].session_hash).not.toContain('sess-adj-1');
  });

  it('rejeita token desconhecido', async () => {
    const result = await requestAdjustment(UNKNOWN_TOKEN, 'Observação para token inexistente.');
    expect(result).toEqual({ ok: false, code: 'not_found' });
  });

  it('rejeita proposta expirada', async () => {
    const result = await requestAdjustment(EXPIRED_TOKEN, 'Observação para proposta expirada.');
    expect(result).toEqual({ ok: false, code: 'expired' });
  });

  it('rejeita proposta já aprovada', async () => {
    const result = await requestAdjustment(APPROVED_TOKEN, 'Observação para proposta aprovada.');
    expect(result).toEqual({ ok: false, code: 'invalid_state' });
  });

  it('rejeita mensagem vazia', async () => {
    const result = await requestAdjustment(BOUNDARY_TOKEN, '');
    expect(result).toEqual({ ok: false, code: 'invalid_message' });
  });

  it('rejeita mensagem com mais de 2000 caracteres', async () => {
    const result = await requestAdjustment(BOUNDARY_TOKEN, 'a'.repeat(2001));
    expect(result).toEqual({ ok: false, code: 'invalid_message' });
  });

  it('aceita mensagem com exatamente 2000 caracteres', async () => {
    const result = await requestAdjustment(BOUNDARY_TOKEN, 'a'.repeat(2000));
    expect(result).toEqual({ ok: true });

    const proposals = (await selectRows(
      'proposals',
      `id=eq.${boundaryProposalId}&select=status`
    )) as ProposalRow[];
    expect(proposals[0].status).toBe('revision_requested');
  });

  it('os registos de ajuste são append-only (sem update ou delete)', async () => {
    const adjustments = (await selectRows(
      'proposal_adjustment_requests',
      `proposal_id=eq.${validProposalId}&select=id`
    )) as AdjustmentRow[];
    const rowId = adjustments[0].id;

    const update = await fetch(
      endpoint(`/rest/v1/proposal_adjustment_requests?id=eq.${rowId}`),
      {
        method: 'PATCH',
        headers: headers(process.env.SUPABASE_SECRET_KEY as string),
        body: JSON.stringify({ message: 'Mensagem alterada' }),
      }
    );
    expect(update.status).toBeGreaterThanOrEqual(400);

    const remove = await fetch(
      endpoint(`/rest/v1/proposal_adjustment_requests?id=eq.${rowId}`),
      {
        method: 'DELETE',
        headers: headers(process.env.SUPABASE_SECRET_KEY as string),
      }
    );
    expect(remove.status).toBeGreaterThanOrEqual(400);
  });
});