/**
 * Serviço de rascunho de propostas: criação, leitura e gravação.
 * A gravação substitui secções e itens (a cópia de trabalho é a fonte de verdade
 * enquanto a proposta está em rascunho).
 */
import { createClient } from '@/lib/supabase/server';
import type { ProposalDraftInput, ProposalSectionInput } from '@/schemas/proposal';
import type { ProposalStatus } from '@/domain/proposal/state-machine';

export interface DraftContext {
  userId: string;
  organizationId: string;
}

export interface DraftItemEditorData {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  priceDelta: number;
  position: number;
}

export interface DraftSectionEditorData {
  id: string;
  title: string;
  mode: 'single' | 'multiple';
  position: number;
  items: DraftItemEditorData[];
}

export interface DraftEditorData {
  id: string;
  title: string;
  baseAmount: number;
  expiresAt: string | null;
  notes: string | null;
  status: ProposalStatus;
  sections: DraftSectionEditorData[];
}

export async function createDraft(context: DraftContext): Promise<string> {
  const client = await createClient();
  const { data, error } = await client
    .from('proposals')
    .insert({ tenant_id: context.organizationId, owner_id: context.userId, title: '', base_amount: 0 })
    .select('id')
    .single();
  if (error || !data) throw new Error('Não foi possível criar o rascunho.');
  return data.id;
}

export async function getDraft(proposalId: string, userId: string): Promise<DraftEditorData> {
  const client = await createClient();
  const { data: proposal, error: proposalError } = await client
    .from('proposals')
    .select('id, title, base_amount, expires_at, notes, status, owner_id')
    .eq('id', proposalId)
    .single();
  if (proposalError || !proposal) throw new Error('Proposta não encontrada.');
  if (proposal.owner_id !== userId) throw new Error('Não tem acesso a esta proposta.');

  const { data: sections, error: sectionsError } = await client
    .from('proposal_sections')
    .select('id, title, mode, position')
    .eq('proposal_id', proposalId)
    .order('position', { ascending: true });
  if (sectionsError) throw new Error('Não foi possível carregar as secções.');

  const sectionIds = (sections ?? []).map((section) => section.id);
  const { data: items, error: itemsError } = sectionIds.length
    ? await client
        .from('proposal_items')
        .select('id, section_id, title, description, image_url, price_delta, position')
        .in('section_id', sectionIds)
        .order('position', { ascending: true })
    : { data: [], error: null };
  if (itemsError) throw new Error('Não foi possível carregar os itens.');

  const itemsBySection = new Map<string, DraftItemEditorData[]>();
  for (const item of items ?? []) {
    const list = itemsBySection.get(item.section_id) ?? [];
    list.push({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.image_url,
      priceDelta: item.price_delta,
      position: item.position,
    });
    itemsBySection.set(item.section_id, list);
  }

  return {
    id: proposal.id,
    title: proposal.title,
    baseAmount: proposal.base_amount,
    expiresAt: proposal.expires_at,
    notes: proposal.notes,
    status: proposal.status,
    sections: (sections ?? []).map((section) => ({
      id: section.id,
      title: section.title,
      mode: section.mode,
      position: section.position,
      items: itemsBySection.get(section.id) ?? [],
    })),
  };
}

export async function saveDraft(
  proposalId: string,
  input: ProposalDraftInput,
  userId: string
): Promise<void> {
  const client = await createClient();
  const { data: proposal, error: proposalError } = await client
    .from('proposals')
    .select('id, owner_id, status')
    .eq('id', proposalId)
    .single();
  if (proposalError || !proposal) throw new Error('Proposta não encontrada.');
  if (proposal.owner_id !== userId) throw new Error('Não tem acesso a esta proposta.');
  if (proposal.status !== 'draft') throw new Error('Apenas propostas em rascunho podem ser editadas.');

  const { error: updateError } = await client
    .from('proposals')
    .update({
      title: input.title,
      base_amount: input.base_amount,
      expires_at: input.expires_at ?? null,
      notes: input.notes ?? null,
    })
    .eq('id', proposalId)
    .eq('owner_id', userId);
  if (updateError) throw new Error('Não foi possível guardar a proposta.');

  await replaceSections(client, proposalId, input.sections);
}

export async function replaceSections(
  client: Awaited<ReturnType<typeof createClient>>,
  proposalId: string,
  sections: ProposalSectionInput[]
): Promise<void> {
  const { error: deleteError } = await client
    .from('proposal_sections')
    .delete()
    .eq('proposal_id', proposalId);
  if (deleteError) throw new Error('Não foi possível atualizar as secções.');

  for (const [sectionIndex, section] of sections.entries()) {
    const { data: inserted, error: sectionError } = await client
      .from('proposal_sections')
      .insert({
        proposal_id: proposalId,
        title: section.title,
        mode: section.mode,
        position: sectionIndex,
      })
      .select('id')
      .single();
    if (sectionError || !inserted) throw new Error('Não foi possível guardar as secções.');

    const { error: itemsError } = await client.from('proposal_items').insert(
      section.items.map((item, itemIndex) => ({
        section_id: inserted.id,
        title: item.title,
        description: item.description ?? null,
        image_url: item.image_url ?? null,
        price_delta: item.price_delta,
        position: itemIndex,
      }))
    );
    if (itemsError) throw new Error('Não foi possível guardar os itens.');
  }
}