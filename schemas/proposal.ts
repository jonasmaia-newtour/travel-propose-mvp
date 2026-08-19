/**
 * Schemas Zod para criação e publicação de propostas.
 * Valores monetários em cêntimos (inteiros). Mensagens de erro em PT-PT.
 */
import { z } from 'zod';

const sectionModeSchema = z.enum(['single', 'multiple']);

const proposalItemSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, 'O título do item é obrigatório.').max(120, 'Título demasiado longo.'),
  description: z.string().trim().max(500, 'Descrição demasiado longa.').optional(),
  image_url: z.string().url('Endereço de imagem inválido.').optional(),
  price_delta: z.number().int('A variação de preço deve ser um número inteiro.'),
});

const proposalSectionSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, 'O título da secção é obrigatório.').max(120, 'Título demasiado longo.'),
  mode: sectionModeSchema,
  order: z.number().int().nonnegative(),
  items: z.array(proposalItemSchema).default([]),
});

export const proposalDraftSchema = z.object({
  title: z.string().trim().max(120, 'Título demasiado longo.').default(''),
  base_amount: z.number().int('O valor base deve ser um número inteiro.').nonnegative().default(0),
  expires_at: z.iso.datetime().optional(),
  notes: z.string().trim().max(1000, 'Observações demasiado longas.').optional(),
  sections: z.array(proposalSectionSchema).default([]),
});

export const proposalPublishSchema = proposalDraftSchema
  .extend({
    title: z.string().trim().min(1, 'O título da proposta é obrigatório para publicar.'),
    expires_at: z.iso.datetime('A validade é obrigatória para publicar.'),
  })
  .superRefine((value, ctx) => {
    if (new Date(value.expires_at).getTime() <= Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expires_at'],
        message: 'A validade deve ser futura.',
      });
    }
    if (value.sections.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sections'],
        message: 'A proposta precisa de pelo menos uma secção.',
      });
    }
    value.sections.forEach((section, index) => {
      if (section.items.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sections', index, 'items'],
          message: 'Cada secção precisa de pelo menos um item selecionável.',
        });
      }
    });
  });

export type ProposalDraftInput = z.infer<typeof proposalDraftSchema>;
export type ProposalPublishInput = z.infer<typeof proposalPublishSchema>;
export type ProposalItemInput = z.infer<typeof proposalItemSchema>;
export type ProposalSectionInput = z.infer<typeof proposalSectionSchema>;