/**
 * Testes da máquina de estados das propostas.
 * Estados: draft, sent, viewed, revision_requested, approved, expired.
 */
import { describe, it, expect } from 'vitest';
import {
  canTransition,
  isExpired,
  isTerminal,
  transition,
} from '../../../domain/proposal/state-machine';

describe('transition', () => {
  it('publica um rascunho', () => {
    expect(transition('draft', 'publish')).toBe('sent');
  });

  it('abre uma proposta enviada', () => {
    expect(transition('sent', 'open')).toBe('viewed');
  });

  it('regista pedido de ajuste a partir de sent ou viewed', () => {
    expect(transition('sent', 'request_adjustment')).toBe('revision_requested');
    expect(transition('viewed', 'request_adjustment')).toBe('revision_requested');
  });

  it('devolve a rascunho após a revisão do agente', () => {
    expect(transition('revision_requested', 'resume_editing')).toBe('draft');
  });

  it('aprova a partir de sent ou viewed', () => {
    expect(transition('sent', 'approve')).toBe('approved');
    expect(transition('viewed', 'approve')).toBe('approved');
  });

  it('expira a partir de sent ou viewed', () => {
    expect(transition('sent', 'expire')).toBe('expired');
    expect(transition('viewed', 'expire')).toBe('expired');
  });

  it('recusa transições a partir de estados terminais', () => {
    expect(() => transition('approved', 'publish')).toThrow();
    expect(() => transition('expired', 'approve')).toThrow();
  });

  it('recusa transições não aprovadas no MVP', () => {
    expect(() => transition('draft', 'approve')).toThrow();
    expect(() => transition('viewed', 'publish')).toThrow();
  });
});

describe('canTransition', () => {
  it('expira antes da aprovação para propostas válidas', () => {
    expect(canTransition('sent', 'expire')).toBe(true);
    expect(canTransition('viewed', 'approve')).toBe(true);
  });

  it('não permite publicar duas vezes', () => {
    expect(canTransition('sent', 'publish')).toBe(false);
  });
});

describe('isTerminal', () => {
  it('approved e expired são terminais', () => {
    expect(isTerminal('approved')).toBe(true);
    expect(isTerminal('expired')).toBe(true);
  });

  it('os restantes estados não são terminais', () => {
    expect(isTerminal('draft')).toBe(false);
    expect(isTerminal('sent')).toBe(false);
    expect(isTerminal('viewed')).toBe(false);
    expect(isTerminal('revision_requested')).toBe(false);
  });
});

describe('isExpired', () => {
  it('deteta expiração por data', () => {
    const agora = new Date('2026-08-19T12:00:00.000Z');
    expect(isExpired(new Date('2026-08-19T11:00:00.000Z'), agora)).toBe(true);
    expect(isExpired(new Date('2026-08-19T13:00:00.000Z'), agora)).toBe(false);
  });

  it('considera expirada uma proposta cuja validade já passou no mesmo instante', () => {
    const limite = new Date('2026-08-19T12:00:00.000Z');
    expect(isExpired(limite, limite)).toBe(true);
  });
});