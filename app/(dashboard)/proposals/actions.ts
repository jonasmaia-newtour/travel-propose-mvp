'use server';

import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/guards';
import { createDraft, saveDraft } from '@/lib/proposals/draft-service';
import { PublishValidationError, publishProposal } from '@/lib/proposals/publish-service';
import { proposalDraftSchema } from '@/schemas/proposal';

export type DraftFormState = { error?: string; ok?: boolean } | null;

export async function createDraftAction(): Promise<never> {
  const { user, organizationId } = await requireRole('MEMBER');
  if (!organizationId) throw new Error('Perfil sem organização.');
  const proposalId = await createDraft({ userId: user.id, organizationId });
  redirect(`/proposals/${proposalId}/edit`);
}

export async function saveDraftAction(
  proposalId: string,
  _state: DraftFormState,
  formData: FormData
): Promise<DraftFormState> {
  const { user } = await requireRole('MEMBER');
  const payload = formData.get('payload');
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(payload ?? ''));
  } catch {
    return { error: 'Rascunho inválido.' };
  }
  const result = proposalDraftSchema.safeParse(parsed);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Rascunho inválido.' };
  }
  try {
    await saveDraft(proposalId, result.data, user.id);
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Não foi possível guardar.' };
  }
}

export type PublishFormState = { error?: string; token?: string } | null;

export async function publishAction(
  proposalId: string,
  _state: PublishFormState,
  formData: FormData
): Promise<PublishFormState> {
  const { user } = await requireRole('MEMBER');
  const payload = formData.get('payload');
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(payload ?? ''));
  } catch {
    return { error: 'Rascunho inválido.' };
  }
  try {
    const { token } = await publishProposal(proposalId, parsed, user.id);
    return { token };
  } catch (error) {
    if (error instanceof PublishValidationError) {
      return { error: error.message };
    }
    return { error: error instanceof Error ? error.message : 'Não foi possível publicar.' };
  }
}