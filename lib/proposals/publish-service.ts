/**
 * Serviço de publicação de propostas.
 * Gera e hasheia o token público e valida o rascunho antes de publicar.
 * Apenas o hash do token é persistido; o token completo é devolvido ao Agent.
 */
import { createHash, randomBytes } from 'node:crypto';
import { proposalPublishSchema, type ProposalPublishInput } from '@/schemas/proposal';

export class PublishValidationError extends Error {
  readonly issues: ReadonlyArray<{ path: string; message: string }>;

  constructor(issues: ReadonlyArray<{ path: string; message: string }>) {
    super(issues.map((issue) => issue.message).join('; '));
    this.name = 'PublishValidationError';
    this.issues = issues;
  }
}

export function generatePublicToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function assertPublishable(input: unknown): ProposalPublishInput {
  const result = proposalPublishSchema.safeParse(input);
  if (!result.success) {
    throw new PublishValidationError(
      result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    );
  }
  return result.data;
}