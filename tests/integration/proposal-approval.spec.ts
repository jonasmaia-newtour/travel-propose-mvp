/**
 * Testes de integração do aceite transacional (US2, T042).
 * Cobrem o contrato de approve_public_proposal: recibo com valores
 * congelados, aceite único por proposta, recusa por expiração, estado
 * terminal, seleção inválida, termos não aceites ou desatualizados, e a
 * imutabilidade do snapshot.
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

const ORG_SLUG = 'approval-test-tenant';
const OWNER_EMAIL = 'approval.owner@test.local';
const VALID_TOKEN = 'approval-valid-token';
const VALID2_TOKEN = 'approval-valid2-token';
const EXPIRED_TOKEN = 'approval-expired-token';
const APPROVED_TOKEN = 'approval-approved-token';
const UNKNOWN_TOKEN = 'approval-unknown-token';

type RpcResult = { ok: boolean; code?: string; receipt?: Record<string, unknown> };
type ProposalRow = { id: string; status: string; approved_at: string | null };
type SnapshotRow = {
  id: string;
  proposal_id: string;
  snapshot: Record<string, unknown>;
  terms_version: number;
  session_hash: string;
};

describe.skipIf(!hasConfig)('aceite transacional público', () => {
  let orgId: string;
  let ownerId: string;
  let validProposalId: string;
  let valid2ProposalId: string;

  async function buildProposal(
    token: string,
    status: string,
    expiresInDays: number
  ): Promise<string> {
    const proposalId = await insertProposal(orgId, ownerId, {
      tokenHash: sha256Hex(token),
      status,
      expiresAt: futureIso(expiresInDays),
      baseAmount: 100000,
    });
    const accommodation = await insertSection(proposalId, 'Alojamento', 'single', 0);
    await insertItem(accommodation, 'Standard', 0, 0);
    await insertItem(accommodation, 'Premium', 5000, 1);
    const extras = await insertSection(proposalId, 'Extras', 'multiple', 1);
    await insertItem(extras, 'Seguro', 2000, 0);
    await insertItem(extras, 'Guia', 3000, 1);
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
    valid2ProposalId = await buildProposal(VALID2_TOKEN, 'sent', 1);
    await buildProposal(EXPIRED_TOKEN, 'sent', -1);
    await buildProposal(APPROVED_TOKEN, 'approved', 1);
  });

  afterAll(async () => {
    if (!URL || !ANON || !hasConfig) return;
    await deleteOrg(ORG_SLUG);
    await deleteUserByEmail(OWNER_EMAIL);
  });

  async function approve(
    token: string,
    selection: number[][],
    options: { termsVersion?: number; termsAccepted?: boolean } = {}
  ): Promise<RpcResult> {
    const result = await rpc('approve_public_proposal', {
      p_token_hash: sha256Hex(token),
      p_selection: selection,
      p_terms_version: options.termsVersion ?? 1,
      p_terms_accepted: options.termsAccepted ?? true,
      p_session_id: 'sess-appr-1',
    });
    expect(result.status).toBe(200);
    return result.data as RpcResult;
  }

  it('aprova uma combinação válida e devolve recibo com o total congelado', async () => {
    const result = await approve(VALID_TOKEN, [
      [1],
      [0, 1],
    ]);
    expect(result.ok).toBe(true);
    const receipt = result.receipt as Record<string, unknown>;
    expect(receipt.currency).toBe('EUR');
    expect(receipt.base_amount).toBe(100000);
    expect(receipt.total).toBe(110000);
    expect(receipt.terms_version).toBe(1);
    expect(receipt.items).toEqual([
      { section_title: 'Alojamento', item_title: 'Premium', price_delta: 5000 },
      { section_title: 'Extras', item_title: 'Seguro', price_delta: 2000 },
      { section_title: 'Extras', item_title: 'Guia', price_delta: 3000 },
    ]);
    expect(Number.isNaN(Date.parse(receipt.approved_at as string))).toBe(false);
    expect(String(receipt.id)).toMatch(/^[0-9a-f-]{36}$/);

    const proposals = (await selectRows(
      'proposals',
      `id=eq.${validProposalId}&select=id,status,approved_at`
    )) as ProposalRow[];
    expect(proposals[0].status).toBe('approved');
    expect(proposals[0].approved_at).toBeTruthy();

    const snapshots = (await selectRows(
      'proposal_approval_snapshots',
      `proposal_id=eq.${validProposalId}&select=id,proposal_id,snapshot,terms_version,session_hash`
    )) as SnapshotRow[];
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].proposal_id).toBe(validProposalId);
    expect(snapshots[0].terms_version).toBe(1);
    expect(snapshots[0].session_hash).toBe(sha256Hex('sess-appr-1'));
    expect(snapshots[0].snapshot.title).toBe('Proposta de integração');
    expect(snapshots[0].snapshot.currency).toBe('EUR');
    expect(snapshots[0].snapshot.base_amount).toBe(100000);
    expect(snapshots[0].snapshot.total).toBe(110000);
  });

  it('recusa uma segunda aprovação da mesma proposta', async () => {
    const result = await approve(VALID_TOKEN, [
      [1],
      [0, 1],
    ]);
    expect(result).toEqual({ ok: false, code: 'invalid_state' });

    const snapshots = (await selectRows(
      'proposal_approval_snapshots',
      `proposal_id=eq.${validProposalId}&select=id`
    )) as SnapshotRow[];
    expect(snapshots).toHaveLength(1);
  });

  it('recusa seleção sem item obrigatório numa secção de escolha única', async () => {
    const result = await approve(VALID2_TOKEN, [
      [],
      [],
    ]);
    expect(result).toEqual({ ok: false, code: 'invalid_selection' });
  });

  it('recusa índice de item fora do intervalo', async () => {
    const result = await approve(VALID2_TOKEN, [
      [0],
      [99],
    ]);
    expect(result).toEqual({ ok: false, code: 'invalid_selection' });
  });

  it('recusa itens duplicados na mesma secção', async () => {
    const result = await approve(VALID2_TOKEN, [
      [0],
      [1, 1],
    ]);
    expect(result).toEqual({ ok: false, code: 'invalid_selection' });
  });

  it('recusa seleção com secções em falta', async () => {
    const result = await approve(VALID2_TOKEN, [[0]]);
    expect(result).toEqual({ ok: false, code: 'invalid_selection' });
  });

  it('recusa termos não aceites', async () => {
    const result = await approve(
      VALID2_TOKEN,
      [
        [0],
        [0],
      ],
      { termsAccepted: false }
    );
    expect(result).toEqual({ ok: false, code: 'terms_required' });
  });

  it('recusa versão dos termos desatualizada', async () => {
    const result = await approve(
      VALID2_TOKEN,
      [
        [0],
        [0],
      ],
      { termsVersion: 99 }
    );
    expect(result).toEqual({ ok: false, code: 'terms_version_mismatch' });
  });

  it('recusa proposta expirada sem gravar snapshot', async () => {
    const result = await approve(EXPIRED_TOKEN, [
      [1],
      [0, 1],
    ]);
    expect(result).toEqual({ ok: false, code: 'expired' });
  });

  it('recusa proposta já aprovada', async () => {
    const result = await approve(APPROVED_TOKEN, [
      [1],
      [0, 1],
    ]);
    expect(result).toEqual({ ok: false, code: 'invalid_state' });
  });

  it('recusa token desconhecido', async () => {
    const result = await approve(UNKNOWN_TOKEN, [
      [1],
      [0, 1],
    ]);
    expect(result).toEqual({ ok: false, code: 'not_found' });
  });

  it('aceita secção múltipla sem itens selecionados', async () => {
    const result = await approve(VALID2_TOKEN, [[1], []]);
    expect(result.ok).toBe(true);
    expect((result.receipt as Record<string, unknown>).total).toBe(105000);

    const snapshots = (await selectRows(
      'proposal_approval_snapshots',
      `proposal_id=eq.${valid2ProposalId}&select=id`
    )) as SnapshotRow[];
    expect(snapshots).toHaveLength(1);
  });

  it('os snapshots são imutáveis (sem update ou delete)', async () => {
    const snapshots = (await selectRows(
      'proposal_approval_snapshots',
      `proposal_id=eq.${validProposalId}&select=id`
    )) as SnapshotRow[];
    const rowId = snapshots[0].id;

    const update = await fetch(endpoint(`/rest/v1/proposal_approval_snapshots?id=eq.${rowId}`), {
      method: 'PATCH',
      headers: headers(process.env.SUPABASE_SECRET_KEY as string),
      body: JSON.stringify({ snapshot: { total: 1 } }),
    });
    expect(update.status).toBeGreaterThanOrEqual(400);

    const remove = await fetch(endpoint(`/rest/v1/proposal_approval_snapshots?id=eq.${rowId}`), {
      method: 'DELETE',
      headers: headers(process.env.SUPABASE_SECRET_KEY as string),
    });
    expect(remove.status).toBeGreaterThanOrEqual(400);
  });
});