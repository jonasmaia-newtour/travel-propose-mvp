/**
 * Testes da sessão anónima pública (T046): identificador estável por
 * separador, sem cookies de terceiros e sem PII; só o hash é gravado
 * pela RPC.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPublicSessionId } from '@/lib/proposals/public-session';

describe('getPublicSessionId', () => {
  afterEach(() => {
    window.sessionStorage.clear();
    vi.resetModules();
  });

  it('devolve um identificador entre 8 e 200 caracteres', () => {
    const id = getPublicSessionId();
    expect(id.length).toBeGreaterThanOrEqual(8);
    expect(id.length).toBeLessThanOrEqual(200);
  });

  it('devolve o mesmo identificador na mesma sessão', () => {
    expect(getPublicSessionId()).toBe(getPublicSessionId());
  });

  it('persiste o identificador no sessionStorage entre chamadas', () => {
    const id = getPublicSessionId();
    expect(window.sessionStorage.getItem('travelpropose.public.session')).toBe(id);
  });
});