/**
 * Testes de contrato da representação pública de uma proposta
 * (GET /api/v1/public/proposals/{token}).
 * Garantem que apenas dados de apresentação são devolvidos e que nunca
 * transpiram IDs internos, tenant_id, dados de utilizadores ou hashes.
 */
import { describe, expect, it } from 'vitest';
import {
  toPublicProposal,
  PUBLIC_CURRENCY,
} from '@/domain/proposal/public-representation';
import { publicProposalSchema, type PublicProposalRaw } from '@/schemas/public-proposal';

function buildRawFixture(): PublicProposalRaw {
  return {
    title: 'Viagem ao Porto',
    base_amount: 120000,
    terms_version: 3,
    notes: 'Condições de pagamento: 30 dias após o aceite.',
    expires_at: '2026-12-31T00:00:00.000Z',
    agency: { name: 'Newtour Test', logo_url: 'https://cdn.example/logo.png' },
    sections: [
      {
        title: 'Alojamento',
        mode: 'single',
        position: 1,
        items: [
          { title: 'Hotel A', description: null, image_url: null, price_delta: 0, position: 0 },
          {
            title: 'Hotel B',
            description: 'Com vista para a Ribeira',
            image_url: null,
            price_delta: 7500,
            position: 1,
          },
        ],
      },
      {
        title: 'Atividades',
        mode: 'multiple',
        position: 0,
        items: [
          { title: 'Visita ao museu', description: null, image_url: null, price_delta: 900, position: 0 },
          {
            title: 'Passeio de barco',
            description: 'Rota do Douro ao pôr do sol',
            image_url: 'https://cdn.example/barco.png',
            price_delta: 1500,
            position: 1,
          },
        ],
      },
    ],
  };
}

describe('toPublicProposal', () => {
  it('devolve apenas a representação pública completa', () => {
    const result = toPublicProposal(buildRawFixture());

    expect(result).toEqual({
      title: 'Viagem ao Porto',
      baseAmount: 120000,
      agency: { name: 'Newtour Test', logoUrl: 'https://cdn.example/logo.png' },
      currency: 'EUR',
      terms: 'Condições de pagamento: 30 dias após o aceite.',
      termsVersion: 3,
      expiresAt: '2026-12-31T00:00:00.000Z',
      sections: [
        {
          title: 'Atividades',
          mode: 'multiple',
          items: [
            { title: 'Visita ao museu', description: null, imageUrl: null, priceDelta: 900 },
            {
              title: 'Passeio de barco',
              description: 'Rota do Douro ao pôr do sol',
              imageUrl: 'https://cdn.example/barco.png',
              priceDelta: 1500,
            },
          ],
        },
        {
          title: 'Alojamento',
          mode: 'single',
          items: [
            { title: 'Hotel A', description: null, imageUrl: null, priceDelta: 0 },
            { title: 'Hotel B', description: 'Com vista para a Ribeira', imageUrl: null, priceDelta: 7500 },
          ],
        },
      ],
    });
  });

  it('ordena secções e itens por posição', () => {
    const result = toPublicProposal(buildRawFixture());

    expect(result.sections.map((section) => section.title)).toEqual(['Atividades', 'Alojamento']);
    expect(result.sections[0].items.map((item) => item.title)).toEqual(['Visita ao museu', 'Passeio de barco']);
    expect(result.sections[1].items.map((item) => item.title)).toEqual(['Hotel A', 'Hotel B']);
  });

  it('ignora campos internos que entrem na representação bruta', () => {
    type LeakyRaw = PublicProposalRaw & { token_hash?: string; tenant_id?: string };
    const leaked: LeakyRaw = {
      ...buildRawFixture(),
      token_hash: 'hash-secreto-abc',
      tenant_id: 'tenant-secreto',
    };
    const result = toPublicProposal(leaked);

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('hash-secreto-abc');
    expect(serialized).not.toContain('tenant-secreto');
  });

  it('nunca expõe identificadores internos nem hashes', () => {
    const result = toPublicProposal(buildRawFixture());

    const keys = new Set([
      ...Object.keys(result),
      ...Object.keys(result.agency),
      ...result.sections.flatMap((section) => [
        ...Object.keys(section),
        ...section.items.flatMap((item) => Object.keys(item)),
      ]),
    ]);
    const forbiddenKeys = ['id', 'tenant_id', 'owner_id', 'token_hash', 'created_at', 'updated_at', 'proposal_id', 'section_id', 'position'];
    for (const key of forbiddenKeys) {
      expect(keys.has(key)).toBe(false);
    }
  });

  it('preserva modos de secção e valores de preço inteiros', () => {
    const result = toPublicProposal(buildRawFixture());

    expect(result.sections.map((section) => section.mode)).toEqual(['multiple', 'single']);
    const deltas = result.sections.flatMap((section) => section.items.map((item) => item.priceDelta));
    expect(deltas).toEqual([900, 1500, 0, 7500]);
    for (const delta of deltas) {
      expect(Number.isInteger(delta)).toBe(true);
    }
    expect(Number.isInteger(result.baseAmount)).toBe(true);
  });

  it('mantém nulo quando os campos opcionais estão ausentes', () => {
    const result = toPublicProposal(buildRawFixture());

    expect(result.agency.logoUrl).not.toBeNull();
    expect(result.sections[0].items[0]).toMatchObject({ description: null, imageUrl: null });
    expect(result.sections[1].items[0].imageUrl).toBeNull();
  });

  it('usa a moeda padrão EUR', () => {
    const result = toPublicProposal(buildRawFixture());

    expect(result.currency).toBe('EUR');
    expect(result.currency).toBe(PUBLIC_CURRENCY);
  });

  it('normaliza a validade com offset para formato UTC Z', () => {
    const raw = buildRawFixture();
    raw.expires_at = '2026-08-21T17:04:00+00:00';
    const result = toPublicProposal(raw);

    expect(result.expiresAt).toBe('2026-08-21T17:04:00.000Z');
    const parsed = publicProposalSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it('produz um objeto válido segundo o schema do contrato', () => {
    const result = toPublicProposal(buildRawFixture());

    const parsed = publicProposalSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });
});

describe('publicProposalSchema', () => {
  it('rejeita a exposição de campos internos', () => {
    const result = toPublicProposal(buildRawFixture());

    expect(publicProposalSchema.safeParse({ ...result, tenant_id: 'tenant-secreto' }).success).toBe(false);
    expect(publicProposalSchema.safeParse({ ...result, token_hash: 'hash-secreto-abc' }).success).toBe(false);
    const withInternalId = { ...result, sections: [{ ...result.sections[0], id: 'sec-id-interna' }] };
    expect(publicProposalSchema.safeParse(withInternalId).success).toBe(false);
  });

  it('rejeita valores inválidos do contrato', () => {
    const result = toPublicProposal(buildRawFixture());

    expect(publicProposalSchema.safeParse({ ...result, expiresAt: 'ontem' }).success).toBe(false);
    expect(publicProposalSchema.safeParse({ ...result, currency: 'USD' }).success).toBe(false);
    expect(publicProposalSchema.safeParse({ ...result, baseAmount: -1 }).success).toBe(false);
    expect(publicProposalSchema.safeParse({ ...result, baseAmount: 12.5 }).success).toBe(false);
    const badDelta = {
      ...result,
      sections: [{ ...result.sections[0], items: [{ ...result.sections[0].items[0], priceDelta: 1.5 }] }],
    };
    expect(publicProposalSchema.safeParse(badDelta).success).toBe(false);
  });
});