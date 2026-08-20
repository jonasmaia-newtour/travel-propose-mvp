/**
 * Schema Zod da representação pública de uma proposta.
 * Contrato GET /api/v1/public/proposals/{token}: título, marca da agência,
 * moeda, termos, validade, secções e itens. Nunca contém IDs internos,
 * tenant_id, dados de utilizadores ou hashes. Objetos são estritos para
 * rejeitar qualquer campo não contratual.
 */
import { z } from 'zod';

const publicProposalItemSchema = z
  .object({
    title: z.string(),
    description: z.string().nullable(),
    imageUrl: z.string().url().nullable(),
    priceDelta: z.number().int(),
  })
  .strict();

const publicProposalSectionSchema = z
  .object({
    title: z.string(),
    mode: z.enum(['single', 'multiple']),
    items: z.array(publicProposalItemSchema),
  })
  .strict();

export const publicProposalSchema = z
  .object({
    title: z.string(),
    agency: z
      .object({
        name: z.string(),
        logoUrl: z.string().url().nullable(),
      })
      .strict(),
    currency: z.literal('EUR'),
    terms: z.string().nullable(),
    expiresAt: z.iso.datetime(),
    sections: z.array(publicProposalSectionSchema),
  })
  .strict();

export type PublicProposal = z.infer<typeof publicProposalSchema>;