/**
 * Testes de formatação de datas e horas (T046): o recibo do aceite mostra
 * data e hora do aceite no locale pt-PT.
 */
import { describe, expect, it } from 'vitest';
import { formatDateTime } from '@/lib/i18n/format';

describe('formatDateTime', () => {
  it('formata data e hora no locale pt-PT', () => {
    const expected = new Intl.DateTimeFormat('pt-PT', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date('2026-08-20T14:45:42Z'));
    expect(formatDateTime('2026-08-20T14:45:42Z')).toBe(expected);
  });

  it('mantém o formato estável para o mesmo instante', () => {
    expect(formatDateTime('2026-08-20T14:45:42Z')).toBe(
      formatDateTime('2026-08-20T14:45:42Z')
    );
  });
});