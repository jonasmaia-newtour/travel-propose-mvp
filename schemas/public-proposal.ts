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
    baseAmount: z.number().int().nonnegative(),
    agency: z
      .object({
        name: z.string(),
        logoUrl: z.string().url().nullable(),
      })
      .strict(),
    currency: z.literal('EUR'),
    terms: z.string().nullable(),
    termsVersion: z.number().int().positive(),
    expiresAt: z.iso.datetime(),
    sections: z.array(publicProposalSectionSchema),
  })
  .strict();

export type PublicProposal = z.infer<typeof publicProposalSchema>;

const publicProposalRawItemSchema = z
  .object({
    title: z.string(),
    description: z.string().nullable(),
    image_url: z.string().url().nullable(),
    price_delta: z.number().int(),
    position: z.number().int().nonnegative(),
  })
  .strict();

const publicProposalRawSectionSchema = z
  .object({
    title: z.string(),
    mode: z.enum(['single', 'multiple']),
    position: z.number().int().nonnegative(),
    items: z.array(publicProposalRawItemSchema),
  })
  .strict();

export const publicProposalRawSchema = z
  .object({
    title: z.string(),
    base_amount: z.number().int().nonnegative(),
    terms_version: z.number().int().positive(),
    notes: z.string().nullable(),
    expires_at: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), 'Data de validade inválida.'),
    agency: z
      .object({
        name: z.string(),
        logo_url: z.string().url().nullable(),
      })
      .strict(),
    sections: z.array(publicProposalRawSectionSchema),
  })
  .strict();

export type PublicProposalRaw = z.infer<typeof publicProposalRawSchema>;