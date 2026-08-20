/**
 * Testes dos schemas Zod das ações públicas (T045):
 * POST /adjustments (mensagem e sessão) e POST /approval (seleção,
 * versão dos termos, aceite e sessão). O contrato exige objetos estritos:
 * campos não previstos são rejeitados e a validação de negócio (índices,
 * duplicados, expiração) fica na RPC — o schema valida apenas a forma.
 */
import { describe, expect, it } from 'vitest';
import {
  adjustmentRequestSchema,
  approvalRequestSchema,
} from '../../../schemas/public-actions';

const VALID_SESSION = 'sessao-abc-1234';

describe('adjustmentRequestSchema', () => {
  it('aceita uma mensagem válida com sessão', () => {
    const result = adjustmentRequestSchema.safeParse({
      message: 'Gostaria de trocar o hotel por uma opção mais económica.',
      sessionId: VALID_SESSION,
    });
    expect(result.success).toBe(true);
  });

  it('normaliza espaços na mensagem', () => {
    const result = adjustmentRequestSchema.safeParse({
      message: '  Gostaria de adiar a viagem.  ',
      sessionId: VALID_SESSION,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe('Gostaria de adiar a viagem.');
    }
  });

  it('rejeita mensagem vazia ou só com espaços', () => {
    expect(
      adjustmentRequestSchema.safeParse({ message: '', sessionId: VALID_SESSION }).success
    ).toBe(false);
    expect(
      adjustmentRequestSchema.safeParse({ message: '   ', sessionId: VALID_SESSION }).success
    ).toBe(false);
  });

  it('rejeita mensagem com mais de 2000 caracteres', () => {
    expect(
      adjustmentRequestSchema.safeParse({
        message: 'a'.repeat(2001),
        sessionId: VALID_SESSION,
      }).success
    ).toBe(false);
  });

  it('aceita mensagem no limite de 2000 caracteres', () => {
    expect(
      adjustmentRequestSchema.safeParse({
        message: 'a'.repeat(2000),
        sessionId: VALID_SESSION,
      }).success
    ).toBe(true);
  });

  it('rejeita sessão curta (menos de 8 caracteres)', () => {
    expect(
      adjustmentRequestSchema.safeParse({ message: 'Mensagem válida', sessionId: 'curta' })
        .success
    ).toBe(false);
  });

  it('rejeita sessão vazia ou em falta', () => {
    expect(
      adjustmentRequestSchema.safeParse({ message: 'Mensagem válida', sessionId: '' }).success
    ).toBe(false);
    expect(adjustmentRequestSchema.safeParse({ message: 'Mensagem válida' }).success).toBe(false);
  });

  it('rejeita campos não previstos no contrato', () => {
    const result = adjustmentRequestSchema.safeParse({
      message: 'Mensagem válida',
      sessionId: VALID_SESSION,
      email: 'viajante@example.com',
    });
    expect(result.success).toBe(false);
  });
});

describe('approvalRequestSchema', () => {
  it('aceita uma aprovação válida com seleção por posições', () => {
    const result = approvalRequestSchema.safeParse({
      selection: [[1], [0, 1]],
      termsVersion: 2,
      termsAccepted: true,
      sessionId: VALID_SESSION,
    });
    expect(result.success).toBe(true);
  });

  it('aceita secções múltiplas sem itens selecionados', () => {
    const result = approvalRequestSchema.safeParse({
      selection: [[0], []],
      termsVersion: 2,
      termsAccepted: true,
      sessionId: VALID_SESSION,
    });
    expect(result.success).toBe(true);
  });

  it('rejeita seleção com índices não inteiros ou negativos', () => {
    expect(
      approvalRequestSchema.safeParse({
        selection: [[1.5], [0]],
        termsVersion: 2,
        termsAccepted: true,
        sessionId: VALID_SESSION,
      }).success
    ).toBe(false);
    expect(
      approvalRequestSchema.safeParse({
        selection: [[-1], [0]],
        termsVersion: 2,
        termsAccepted: true,
        sessionId: VALID_SESSION,
      }).success
    ).toBe(false);
  });

  it('rejeita seleção com forma inválida', () => {
    expect(
      approvalRequestSchema.safeParse({
        selection: '[[1],[0]]',
        termsVersion: 2,
        termsAccepted: true,
        sessionId: VALID_SESSION,
      }).success
    ).toBe(false);
    expect(
      approvalRequestSchema.safeParse({
        selection: [[1, 'a']],
        termsVersion: 2,
        termsAccepted: true,
        sessionId: VALID_SESSION,
      }).success
    ).toBe(false);
  });

  it('rejeita versão dos termos não positiva ou não inteira', () => {
    expect(
      approvalRequestSchema.safeParse({
        selection: [[0], [0]],
        termsVersion: 0,
        termsAccepted: true,
        sessionId: VALID_SESSION,
      }).success
    ).toBe(false);
    expect(
      approvalRequestSchema.safeParse({
        selection: [[0], [0]],
        termsVersion: 1.5,
        termsAccepted: true,
        sessionId: VALID_SESSION,
      }).success
    ).toBe(false);
  });

  it('permite termos não aceites (validação de negócio na RPC)', () => {
    const result = approvalRequestSchema.safeParse({
      selection: [[0], [0]],
      termsVersion: 2,
      termsAccepted: false,
      sessionId: VALID_SESSION,
    });
    expect(result.success).toBe(true);
  });

  it('rejeita sessão em falta', () => {
    expect(
      approvalRequestSchema.safeParse({
        selection: [[0], [0]],
        termsVersion: 2,
        termsAccepted: true,
      }).success
    ).toBe(false);
  });

  it('rejeita campos não previstos no contrato', () => {
    const result = approvalRequestSchema.safeParse({
      selection: [[0], [0]],
      termsVersion: 2,
      termsAccepted: true,
      sessionId: VALID_SESSION,
      agentId: 'secreto',
    });
    expect(result.success).toBe(false);
  });
});