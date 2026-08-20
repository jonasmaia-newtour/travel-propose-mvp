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
  type PublishedProposalRow,
} from '@/domain/proposal/public-representation';
import { publicProposalSchema } from '@/schemas/public-proposal';
import type { Database } from '@/lib/supabase/types';

type OrganizationRow = Database['public']['Tables']['organizations']['Row'];
type SectionRow = Database['public']['Tables']['proposal_sections']['Row'];
type ItemRow = Database['public']['Tables']['proposal_items']['Row'];

function buildFixture() {
  const organization: OrganizationRow = {
    id: 'org-fabrica-interna',
    name: 'Newtour Test',
    slug: 'newtour-test',
    logo_url: 'https://cdn.example/logo.png',
    primary_color: '#0b2545',
    secondary_color: '#2ec4b6',
    accent_color: '#f4a261',
    locale: 'pt-PT',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };

  const proposal: PublishedProposalRow = {
    id: 'prop-id-interno',
    tenant_id: 'tenant-secreto',
    owner_id: 'user-interno',
    title: 'Viagem ao Porto',
    base_amount: 120000,
    status: 'sent',
    token_hash: 'hash-secreto-abc',
    expires_at: '2026-12-31T00:00:00.000Z',
    notes: 'Condições de pagamento: 30 dias após o aceite.',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
  };

  const sections: SectionRow[] = [
    {
      id: 'sec-id-a',
      proposal_id: proposal.id,
      title: 'Alojamento',
      mode: 'single',
      position: 1,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'sec-id-b',
      proposal_id: proposal.id,
      title: 'Atividades',
      mode: 'multiple',
      position: 0,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ];

  const items: ItemRow[] = [
    {
      id: 'item-id-b1',
      section_id: 'sec-id-b',
      title: 'Passeio de barco',
      description: 'Rota do Douro ao pôr do sol',
      image_url: 'https://cdn.example/barco.png',
      price_delta: 1500,
      position: 1,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'item-id-a0',
      section_id: 'sec-id-a',
      title: 'Hotel A',
      description: null,
      image_url: null,
      price_delta: 0,
      position: 0,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'item-id-a1',
      section_id: 'sec-id-a',
      title: 'Hotel B',
      description: 'Com vista para a Ribeira',
      image_url: null,
      price_delta: 7500,
      position: 1,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'item-id-b0',
      section_id: 'sec-id-b',
      title: 'Visita ao museu',
      description: null,
      image_url: null,
      price_delta: 900,
      position: 0,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ];

  return { organization, proposal, sections, items };
}

describe('toPublicProposal', () => {
  it('devolve apenas a representação pública completa', () => {
    const { organization, proposal, sections, items } = buildFixture();
    const result = toPublicProposal(proposal, organization, sections, items);

    expect(result).toEqual({
      title: 'Viagem ao Porto',
      agency: { name: 'Newtour Test', logoUrl: 'https://cdn.example/logo.png' },
      currency: 'EUR',
      terms: 'Condições de pagamento: 30 dias após o aceite.',
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
    const { organization, proposal, sections, items } = buildFixture();
    const result = toPublicProposal(proposal, organization, sections, items);

    expect(result.sections.map((section) => section.title)).toEqual(['Atividades', 'Alojamento']);
    expect(result.sections[0].items.map((item) => item.title)).toEqual(['Visita ao museu', 'Passeio de barco']);
    expect(result.sections[1].items.map((item) => item.title)).toEqual(['Hotel A', 'Hotel B']);
  });

  it('nunca expõe identificadores internos nem hashes', () => {
    const { organization, proposal, sections, items } = buildFixture();
    const result = toPublicProposal(proposal, organization, sections, items);

    const serialized = JSON.stringify(result);
    const forbiddenValues = [
      'org-fabrica-interna',
      'tenant-secreto',
      'prop-id-interno',
      'user-interno',
      'hash-secreto-abc',
      'sec-id-a',
      'sec-id-b',
      'item-id-a0',
      'item-id-a1',
      'item-id-b0',
      'item-id-b1',
      '2026-01-01T00:00:00.000Z',
      '2026-01-02T00:00:00.000Z',
    ];
    for (const value of forbiddenValues) {
      expect(serialized).not.toContain(value);
    }

    const keys = new Set([
      ...Object.keys(result),
      ...Object.keys(result.agency),
      ...result.sections.flatMap((section) => [
        ...Object.keys(section),
        ...section.items.flatMap((item) => Object.keys(item)),
      ]),
    ]);
    const forbiddenKeys = ['id', 'tenant_id', 'owner_id', 'token_hash', 'created_at', 'updated_at', 'proposal_id', 'section_id'];
    for (const key of forbiddenKeys) {
      expect(keys.has(key)).toBe(false);
    }
  });

  it('preserva modos de secção e valores de preço inteiros', () => {
    const { organization, proposal, sections, items } = buildFixture();
    const result = toPublicProposal(proposal, organization, sections, items);

    expect(result.sections.map((section) => section.mode)).toEqual(['multiple', 'single']);
    const deltas = result.sections.flatMap((section) => section.items.map((item) => item.priceDelta));
    expect(deltas).toEqual([900, 1500, 0, 7500]);
    for (const delta of deltas) {
      expect(Number.isInteger(delta)).toBe(true);
    }
  });

  it('mantém nulo quando os campos opcionais estão ausentes', () => {
    const { organization, proposal, sections, items } = buildFixture();
    const result = toPublicProposal(proposal, organization, sections, items);

    expect(result.agency.logoUrl).not.toBeNull();
    expect(result.sections[0].items[0]).toMatchObject({ description: null, imageUrl: null });
    expect(result.sections[1].items[0].imageUrl).toBeNull();
  });

  it('usa a moeda padrão EUR', () => {
    const { organization, proposal, sections, items } = buildFixture();
    const result = toPublicProposal(proposal, organization, sections, items);

    expect(result.currency).toBe('EUR');
    expect(result.currency).toBe(PUBLIC_CURRENCY);
  });

  it('produz um objeto válido segundo o schema do contrato', () => {
    const { organization, proposal, sections, items } = buildFixture();
    const result = toPublicProposal(proposal, organization, sections, items);

    const parsed = publicProposalSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });
});

describe('publicProposalSchema', () => {
  it('rejeita a exposição de campos internos', () => {
    const { organization, proposal, sections, items } = buildFixture();
    const result = toPublicProposal(proposal, organization, sections, items);

    expect(publicProposalSchema.safeParse({ ...result, tenant_id: 'tenant-secreto' }).success).toBe(false);
    expect(publicProposalSchema.safeParse({ ...result, token_hash: 'hash-secreto-abc' }).success).toBe(false);
    const withInternalId = { ...result, sections: [{ ...result.sections[0], id: 'sec-id-interna' }] };
    expect(publicProposalSchema.safeParse(withInternalId).success).toBe(false);
  });

  it('rejeita valores inválidos do contrato', () => {
    const { organization, proposal, sections, items } = buildFixture();
    const result = toPublicProposal(proposal, organization, sections, items);

    expect(publicProposalSchema.safeParse({ ...result, expiresAt: 'ontem' }).success).toBe(false);
    expect(publicProposalSchema.safeParse({ ...result, currency: 'USD' }).success).toBe(false);
    const badDelta = {
      ...result,
      sections: [{ ...result.sections[0], items: [{ ...result.sections[0].items[0], priceDelta: 1.5 }] }],
    };
    expect(publicProposalSchema.safeParse(badDelta).success).toBe(false);
  });
});