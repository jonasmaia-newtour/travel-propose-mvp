/**
 * Testes unitários do serviço de publicação de propostas.
 * Cobre geração e hashing do token público e validação pré-publicação.
 */
import { describe, expect, it } from 'vitest';
import {
  assertPublishable,
  generatePublicToken,
  hashToken,
  PublishValidationError,
} from '../../../lib/proposals/publish-service';

const VALID_EXPIRES_AT = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

describe('generatePublicToken', () => {
  it('gera um token nao vazio', () => {
    const token = generatePublicToken();
    expect(token.length).toBeGreaterThan(0);
  });

  it('gera tokens unicos entre chamadas', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generatePublicToken()));
    expect(tokens.size).toBe(100);
  });

  it('usa apenas caracteres seguros para URL', () => {
    const token = generatePublicToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token).not.toContain('=');
  });

  it('tem entropia suficiente (pelo menos 32 bytes)', () => {
    expect(generatePublicToken().length).toBeGreaterThanOrEqual(40);
  });
});

describe('hashToken', () => {
  it('produz um hash hex de 64 caracteres', () => {
    expect(hashToken('token-de-teste')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('e determinista para o mesmo token', () => {
    const token = generatePublicToken();
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('produz hashes diferentes para tokens diferentes', () => {
    const a = generatePublicToken();
    const b = generatePublicToken();
    expect(hashToken(a)).not.toBe(hashToken(b));
  });

  it('nao revela o token original no hash', () => {
    const token = generatePublicToken();
    const hash = hashToken(token);
    expect(hash).not.toContain(token);
    expect(hash).not.toBe(token);
  });
});

describe('assertPublishable', () => {
  it('aceita um rascunho publicavel valido', () => {
    const input = {
      title: '  Viagem ao Porto  ',
      base_amount: 120000,
      expires_at: VALID_EXPIRES_AT,
      notes: 'Inclui voo e hotel',
      sections: [
        {
          title: 'Alojamento',
          mode: 'single',
          order: 0,
          items: [{ title: 'Hotel A', price_delta: 0 }],
        },
      ],
    };
    const result = assertPublishable(input);
    expect(result.title).toBe('Viagem ao Porto');
    expect(result.sections).toHaveLength(1);
  });

  it('rejeita proposta sem titulo', () => {
    const input = {
      title: '',
      base_amount: 0,
      expires_at: VALID_EXPIRES_AT,
      sections: [],
    };
    expect(() => assertPublishable(input)).toThrow(PublishValidationError);
    expect(() => assertPublishable(input)).toThrow(/t[ií]tulo/i);
  });

  it('rejeita proposta sem validade', () => {
    const input = {
      title: 'Viagem',
      base_amount: 0,
      sections: [],
    };
    expect(() => assertPublishable(input)).toThrow(PublishValidationError);
    expect(() => assertPublishable(input)).toThrow(/validade/i);
  });

  it('rejeita validade no passado', () => {
    const input = {
      title: 'Viagem',
      base_amount: 0,
      expires_at: new Date(Date.now() - 1000).toISOString(),
      sections: [],
    };
    expect(() => assertPublishable(input)).toThrow(/futura/i);
  });

  it('rejeita proposta sem seccoes', () => {
    const input = {
      title: 'Viagem',
      base_amount: 0,
      expires_at: VALID_EXPIRES_AT,
      sections: [],
    };
    expect(() => assertPublishable(input)).toThrow(/pelo menos uma sec[çc][ãa]o/i);
  });

  it('rejeita secao sem itens', () => {
    const input = {
      title: 'Viagem',
      base_amount: 0,
      expires_at: VALID_EXPIRES_AT,
      sections: [{ title: 'Alojamento', mode: 'single', order: 0, items: [] }],
    };
    expect(() => assertPublishable(input)).toThrow(/pelo menos um item/i);
  });

  it('agrega todos os erros encontrados', () => {
    const input = {
      title: '',
      expires_at: new Date(Date.now() - 1000).toISOString(),
      sections: [],
    };
    try {
      assertPublishable(input);
      expect.unreachable('devia ter lancado');
    } catch (error) {
      expect(error).toBeInstanceOf(PublishValidationError);
      const messages = (error as PublishValidationError).issues.map((issue) => issue.message);
      expect(messages.some((message) => /t[ií]tulo/i.test(message))).toBe(true);
      expect(messages.some((message) => /sec[çc][ãa]o/i.test(message))).toBe(true);
    }
  });
});