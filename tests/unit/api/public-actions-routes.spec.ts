/**
 * Testes das rotas públicas de ações (T045):
 * POST /adjustments (pedido de ajuste) e POST /approval (aceite).
 * O client Supabase é mockado; os testes garantem o mapeamento dos
 * códigos da RPC para os status HTTP do contrato (202/201/404/409/422).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}));

import { POST as postAdjustment } from '@/app/api/v1/public/proposals/[token]/adjustments/route';
import { POST as postApproval } from '@/app/api/v1/public/proposals/[token]/approval/route';

const TOKEN = 'token-publico-de-teste';
const PARAMS = { params: Promise.resolve({ token: TOKEN }) };
const VALID_SESSION = 'sessao-abc-1234';

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockRpc(result: { ok: boolean; code?: string; receipt?: unknown } | null, error: unknown = null) {
  createClientMock.mockResolvedValue({
    rpc: vi.fn().mockResolvedValue({ data: result, error }),
  });
}

beforeEach(() => {
  createClientMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /adjustments', () => {
  it('devolve 202 quando o pedido é aceite', async () => {
    mockRpc({ ok: true });
    const response = await postAdjustment(
      jsonRequest({ message: 'Gostaria de trocar o hotel.', sessionId: VALID_SESSION }),
      PARAMS,
    );
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ ok: true });
  });

  it('envia o hash do token e a sessão à RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { ok: true }, error: null });
    createClientMock.mockResolvedValue({ rpc });
    await postAdjustment(
      jsonRequest({ message: 'Gostaria de trocar o hotel.', sessionId: VALID_SESSION }),
      PARAMS,
    );
    expect(rpc).toHaveBeenCalledWith('request_public_adjustment', {
      p_token_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
      p_message: 'Gostaria de trocar o hotel.',
      p_session_id: VALID_SESSION,
    });
  });

  it('devolve 422 para mensagem inválida', async () => {
    const response = await postAdjustment(
      jsonRequest({ message: '   ', sessionId: VALID_SESSION }),
      PARAMS,
    );
    expect(response.status).toBe(422);
  });

  it('devolve 400 para corpo não JSON', async () => {
    const response = await postAdjustment(
      new Request('http://localhost', { method: 'POST', body: 'não é json' }),
      PARAMS,
    );
    expect(response.status).toBe(400);
  });

  it('devolve 404 genérico para token desconhecido', async () => {
    mockRpc({ ok: false, code: 'not_found' });
    const response = await postAdjustment(
      jsonRequest({ message: 'Mensagem válida', sessionId: VALID_SESSION }),
      PARAMS,
    );
    expect(response.status).toBe(404);
    expect((await response.json()).error).toMatch(/n[ãa]o encontrada/i);
  });

  it('devolve 409 para proposta expirada ou em estado inválido', async () => {
    mockRpc({ ok: false, code: 'expired' });
    const expired = await postAdjustment(
      jsonRequest({ message: 'Mensagem válida', sessionId: VALID_SESSION }),
      PARAMS,
    );
    expect(expired.status).toBe(409);

    mockRpc({ ok: false, code: 'invalid_state' });
    const invalid = await postAdjustment(
      jsonRequest({ message: 'Mensagem válida', sessionId: VALID_SESSION }),
      PARAMS,
    );
    expect(invalid.status).toBe(409);
  });

  it('devolve 500 quando a RPC falha', async () => {
    mockRpc(null, new Error('falha na rede'));
    const response = await postAdjustment(
      jsonRequest({ message: 'Mensagem válida', sessionId: VALID_SESSION }),
      PARAMS,
    );
    expect(response.status).toBe(500);
  });
});

describe('POST /approval', () => {
  it('devolve 201 com recibo mapeado para o contrato público', async () => {
    mockRpc({
      ok: true,
      receipt: {
        id: '8536c0f2-4472-404e-8928-389be6956e98',
        approved_at: '2026-08-20T14:45:42.394392+00:00',
        currency: 'EUR',
        base_amount: 100000,
        total: 110000,
        terms_version: 1,
        items: [
          { section_title: 'Alojamento', item_title: 'Premium', price_delta: 5000 },
        ],
      },
    });
    const response = await postApproval(
      jsonRequest({
        selection: [[1], [0, 1]],
        termsVersion: 1,
        termsAccepted: true,
        sessionId: VALID_SESSION,
      }),
      PARAMS,
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: '8536c0f2-4472-404e-8928-389be6956e98',
      approvedAt: '2026-08-20T14:45:42.394392+00:00',
      currency: 'EUR',
      baseAmount: 100000,
      total: 110000,
      termsVersion: 1,
      items: [{ sectionTitle: 'Alojamento', itemTitle: 'Premium', priceDelta: 5000 }],
    });
  });

  it('envia a seleção, termos e sessão à RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        ok: true,
        receipt: { id: 'x', approved_at: '2026-08-20T00:00:00.000Z', currency: 'EUR', base_amount: 100000, total: 100000, terms_version: 1, items: [] },
      },
      error: null,
    });
    createClientMock.mockResolvedValue({ rpc });
    await postApproval(
      jsonRequest({
        selection: [[1], [0, 1]],
        termsVersion: 1,
        termsAccepted: true,
        sessionId: VALID_SESSION,
      }),
      PARAMS,
    );
    expect(rpc).toHaveBeenCalledWith('approve_public_proposal', {
      p_token_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
      p_selection: [[1], [0, 1]],
      p_terms_version: 1,
      p_terms_accepted: true,
      p_session_id: VALID_SESSION,
    });
  });

  it('devolve 422 para seleção com forma inválida', async () => {
    const response = await postApproval(
      jsonRequest({
        selection: 'não é uma seleção',
        termsVersion: 1,
        termsAccepted: true,
        sessionId: VALID_SESSION,
      }),
      PARAMS,
    );
    expect(response.status).toBe(422);
  });

  it('devolve 422 quando a RPC recusa a seleção', async () => {
    mockRpc({ ok: false, code: 'invalid_selection' });
    const response = await postApproval(
      jsonRequest({
        selection: [[0], [99]],
        termsVersion: 1,
        termsAccepted: true,
        sessionId: VALID_SESSION,
      }),
      PARAMS,
    );
    expect(response.status).toBe(422);
  });

  it('devolve 409 para expirada, aprovada ou termos desatualizados', async () => {
    for (const code of ['expired', 'invalid_state', 'terms_required', 'terms_version_mismatch']) {
      mockRpc({ ok: false, code });
      const response = await postApproval(
        jsonRequest({
          selection: [[0], [0]],
          termsVersion: 1,
          termsAccepted: true,
          sessionId: VALID_SESSION,
        }),
        PARAMS,
      );
      expect(response.status, `código ${code}`).toBe(409);
    }
  });

  it('devolve 404 genérico para token desconhecido', async () => {
    mockRpc({ ok: false, code: 'not_found' });
    const response = await postApproval(
      jsonRequest({
        selection: [[0], [0]],
        termsVersion: 1,
        termsAccepted: true,
        sessionId: VALID_SESSION,
      }),
      PARAMS,
    );
    expect(response.status).toBe(404);
  });

  it('devolve 400 para corpo não JSON', async () => {
    const response = await postApproval(
      new Request('http://localhost', { method: 'POST', body: 'não é json' }),
      PARAMS,
    );
    expect(response.status).toBe(400);
  });
});