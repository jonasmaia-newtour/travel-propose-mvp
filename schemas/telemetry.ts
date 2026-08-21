/**
 * Schemas Zod da telemetria pública (T048):
 * POST /api/v1/public/proposals/[token]/events.
 * Eventos mínimos: opened e selection_changed, com sessão anonimizada,
 * dispositivo e país opcionais. Nunca IP em bruto, cookies de terceiros
 * ou PII. A validação de existência da proposta fica na RPC.
 */
import { z } from 'zod';

const sessionIdSchema = z.string().trim().min(8).max(200);

const selectionPayloadSchema = z
  .object({
    selection: z.array(z.array(z.number().int().nonnegative())),
  })
  .strict();

export const telemetryEventSchema = z
  .object({
    type: z.enum(['opened', 'selection_changed']),
    sessionId: sessionIdSchema,
    payload: selectionPayloadSchema.optional(),
    device: z.string().trim().min(1).max(50).optional(),
    country: z.string().trim().length(2).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.type === 'selection_changed' && value.payload === undefined) {
      context.addIssue({
        code: 'custom',
        message: 'Seleção em falta para evento selection_changed.',
        path: ['payload'],
      });
    }
    if (value.type === 'opened' && value.payload !== undefined) {
      context.addIssue({
        code: 'custom',
        message: 'Evento opened não deve incluir payload.',
        path: ['payload'],
      });
    }
  });

export type TelemetryEvent = z.infer<typeof telemetryEventSchema>;
