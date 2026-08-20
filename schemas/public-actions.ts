/**
 * Schemas Zod das ações públicas (T045):
 * POST /adjustments e POST /approval.
 * Validam apenas a forma do pedido; a validação de negócio (índices de
 * item, duplicados, prazo, estado) acontece na RPC — fonte de verdade.
 * A sessão é obrigatória e nunca é persistida em bruto (só o hash).
 */
import { z } from 'zod';

const sessionIdSchema = z.string().trim().min(8).max(200);

export const adjustmentRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(2000),
    sessionId: sessionIdSchema,
  })
  .strict();

export const approvalRequestSchema = z
  .object({
    selection: z.array(z.array(z.number().int().nonnegative())),
    termsVersion: z.number().int().positive(),
    termsAccepted: z.boolean(),
    sessionId: sessionIdSchema,
  })
  .strict();

export type AdjustmentRequest = z.infer<typeof adjustmentRequestSchema>;
export type ApprovalRequest = z.infer<typeof approvalRequestSchema>;