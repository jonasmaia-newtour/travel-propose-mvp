/**
 * Testes da rota pública de pedido de ajuste (T045):
 * POST /adjustments. O client Supabase é mockado; os testes garantem o
 * mapeamento dos códigos da RPC para os status HTTP do contrato.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}));

import { POST as postAdjustment } from '@/app/api/v1/public/proposals/[token]/adjustments/route';

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

function mockRpc(result: { ok: boolean; code?: string } | null, error: unknown = null) {
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