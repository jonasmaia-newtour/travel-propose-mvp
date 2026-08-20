/**
 * Representação pública de uma proposta (contrato
 * GET /api/v1/public/proposals/{token}). Mapeia apenas dados de apresentação:
 * nunca expõe IDs internos, tenant_id, dados de utilizadores ou hashes.
 * A moeda é fixa em EUR no MVP (não existe coluna de moeda no modelo atual).
 */
import type { Database } from '@/lib/supabase/types';
import type { PublicProposal } from '@/schemas/public-proposal';

type ProposalRow = Database['public']['Tables']['proposals']['Row'];
type OrganizationRow = Database['public']['Tables']['organizations']['Row'];
type SectionRow = Database['public']['Tables']['proposal_sections']['Row'];
type ItemRow = Database['public']['Tables']['proposal_items']['Row'];

export type PublishedProposalRow = ProposalRow & { expires_at: string };

export const PUBLIC_CURRENCY = 'EUR' as const;

export function toPublicProposal(
  proposal: PublishedProposalRow,
  organization: OrganizationRow,
  sections: readonly SectionRow[],
  items: readonly ItemRow[],
): PublicProposal {
  return {
    title: proposal.title,
    agency: {
      name: organization.name,
      logoUrl: organization.logo_url,
    },
    currency: PUBLIC_CURRENCY,
    terms: proposal.notes,
    expiresAt: proposal.expires_at,
    sections: [...sections]
      .sort((a, b) => a.position - b.position)
      .map((section) => ({
        title: section.title,
        mode: section.mode,
        items: items
          .filter((item) => item.section_id === section.id)
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