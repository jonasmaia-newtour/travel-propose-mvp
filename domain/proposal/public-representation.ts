/**
 * Representação pública de uma proposta (contrato
 * GET /api/v1/public/proposals/{token}). Transforma a representação bruta
 * devolvida por get_public_proposal (apenas colunas públicas, sem IDs
 * internos, tenant_id, dados de utilizadores ou hashes) na forma pública
 * final. A moeda é fixa em EUR no MVP (não existe coluna de moeda no modelo).
 */
import type { PublicProposal, PublicProposalRaw } from '@/schemas/public-proposal';

export const PUBLIC_CURRENCY = 'EUR' as const;

export function toPublicProposal(raw: PublicProposalRaw): PublicProposal {
  return {
    title: raw.title,
    baseAmount: raw.base_amount,
    agency: {
      name: raw.agency.name,
      logoUrl: raw.agency.logo_url,
    },
    currency: PUBLIC_CURRENCY,
    terms: raw.notes,
    expiresAt: new Date(raw.expires_at).toISOString(),
    sections: [...raw.sections]
      .sort((a, b) => a.position - b.position)
      .map((section) => ({
        title: section.title,
        mode: section.mode,
        items: [...section.items]
          .sort((a, b) => a.position - b.position)
          .map((item) => ({
            title: item.title,
            description: item.description,
            imageUrl: item.image_url,
            priceDelta: item.price_delta,
          })),
      })),
  };
}