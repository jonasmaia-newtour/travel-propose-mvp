/**
 * Serviço de publicação de propostas.
 * Gera e hasheia o token público e valida o rascunho antes de publicar.
 * Apenas o hash do token é persistido; o token completo é devolvido ao Agent.
 */
import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { proposalPublishSchema, type ProposalPublishInput } from '@/schemas/proposal';
import { transition } from '@/domain/proposal/state-machine';
import { replaceSections } from '@/lib/proposals/draft-service';

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

export async function publishProposal(
  proposalId: string,
  input: unknown,
  userId: string
): Promise<{ token: string }> {
  const draft = assertPublishable(input);
  const client = await createClient();

  const { data: proposal, error: fetchError } = await client
    .from('proposals')
    .select('id, owner_id, status')
    .eq('id', proposalId)
    .single();
  if (fetchError || !proposal) throw new Error('Proposta não encontrada.');
  if (proposal.owner_id !== userId) throw new Error('Não tem permissão para publicar esta proposta.');
  const nextStatus = transition(proposal.status, 'publish');

  const token = generatePublicToken();
  const tokenHash = hashToken(token);

  await replaceSections(client, proposalId, draft.sections);
  const { error: updateError } = await client
    .from('proposals')
    .update({
      title: draft.title,
      base_amount: draft.base_amount,
      expires_at: draft.expires_at,
      notes: draft.notes ?? null,
      status: nextStatus,
      token_hash: tokenHash,
    })
    .eq('id', proposalId)
    .eq('owner_id', userId);
  if (updateError) throw new Error('Não foi possível publicar a proposta.');

  return { token };
}