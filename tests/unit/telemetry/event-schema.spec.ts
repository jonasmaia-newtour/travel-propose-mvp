/**
 * Testes de privacidade e forma do evento de telemetria (T048):
 * garante que apenas opened/selection_changed são aceites,
 * que PII nunca passa no strict e que payload é limitado.
 */
import { describe, expect, it } from 'vitest';
import { telemetryEventSchema } from '../../../schemas/telemetry';

const VALID_SESSION = 'sessao-abc-1234';

describe('telemetryEventSchema', () => {
  it('aceita evento opened válido sem payload', () => {
    const result = telemetryEventSchema.safeParse({
      type: 'opened',
      sessionId: VALID_SESSION,
    });
    expect(result.success).toBe(true);
  });

  it('aceita opened com device e country', () => {
    const result = telemetryEventSchema.safeParse({
      type: 'opened',
      sessionId: VALID_SESSION,
      device: 'mobile',
      country: 'PT',
    });
    expect(result.success).toBe(true);
  });

  it('aceita selection_changed com payload de seleção', () => {
    const result = telemetryEventSchema.safeParse({
      type: 'selection_changed',
      sessionId: VALID_SESSION,
      payload: { selection: [[1], [0, 1]] },
      device: 'desktop',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita selection_changed sem payload', () => {
    expect(
      telemetryEventSchema.safeParse({ type: 'selection_changed', sessionId: VALID_SESSION })
        .success
    ).toBe(false);
  });

  it('rejeita opened com payload', () => {
    expect(
      telemetryEventSchema.safeParse({
        type: 'opened',
        sessionId: VALID_SESSION,
        payload: { selection: [[0]] },
      }).success
    ).toBe(false);
  });

  it('rejeita tipo desconhecido', () => {
    expect(
      telemetryEventSchema.safeParse({ type: 'viewed', sessionId: VALID_SESSION }).success
    ).toBe(false);
  });

  it('rejeita sessão curta ou em falta', () => {
    expect(
      telemetryEventSchema.safeParse({ type: 'opened', sessionId: 'curta' }).success
    ).toBe(false);
    expect(telemetryEventSchema.safeParse({ type: 'opened' }).success).toBe(false);
  });

  it('rejeita sessão longa demais', () => {
    expect(
      telemetryEventSchema.safeParse({ type: 'opened', sessionId: 'a'.repeat(201) }).success
    ).toBe(false);
  });

  it('rejeita seleção com índices inválidos', () => {
    expect(
      telemetryEventSchema.safeParse({
        type: 'selection_changed',
        sessionId: VALID_SESSION,
        payload: { selection: [[1.5]] },
      }).success
    ).toBe(false);
    expect(
      telemetryEventSchema.safeParse({
        type: 'selection_changed',
        sessionId: VALID_SESSION,
        payload: { selection: [[-1]] },
      }).success
    ).toBe(false);
  });

  it('rejeita payload com forma inválida', () => {
    expect(
      telemetryEventSchema.safeParse({
        type: 'selection_changed',
        sessionId: VALID_SESSION,
        payload: { selection: '[[1]]' },
      }).success
    ).toBe(false);
  });

  it('rejeita campos de PII não previstos', () => {
    expect(
      telemetryEventSchema.safeParse({
        type: 'opened',
        sessionId: VALID_SESSION,
        email: 'viajante@example.com',
      }).success
    ).toBe(false);
    expect(
      telemetryEventSchema.safeParse({
        type: 'opened',
        sessionId: VALID_SESSION,
        ip: '192.168.0.1',
      }).success
    ).toBe(false);
    expect(
      telemetryEventSchema.safeParse({
        type: 'opened',
        sessionId: VALID_SESSION,
        userAgent: 'Mozilla',
      }).success
    ).toBe(false);
  });

  it('rejeita payload com campo extra', () => {
    expect(
      telemetryEventSchema.safeParse({
        type: 'selection_changed',
        sessionId: VALID_SESSION,
        payload: { selection: [[0]], extra: 'x' },
      }).success
    ).toBe(false);
  });

  it('rejeita country com tamanho inválido', () => {
    expect(
      telemetryEventSchema.safeParse({ type: 'opened', sessionId: VALID_SESSION, country: 'POR' })
        .success
    ).toBe(false);
  });

  it('normaliza espaços em sessionId e device', () => {
    const result = telemetryEventSchema.safeParse({
      type: 'opened',
      sessionId: `  ${VALID_SESSION}  `,
      device: '  mobile  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sessionId).toBe(VALID_SESSION);
      expect(result.data.device).toBe('mobile');
    }
  });
});
