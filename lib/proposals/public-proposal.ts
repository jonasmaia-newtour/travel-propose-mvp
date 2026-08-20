/**
 * Leitura pública de uma proposta pelo token do link seguro.
 * Partilhado pela rota API e pela página pública. Devolve null para token
 * inválido, expirado ou inexistente (404 genérico).
 */
import { createClient } from '@/lib/supabase/server';
import { hashToken } from '@/lib/proposals/publish-service';
import { toPublicProposal } from '@/domain/proposal/public-representation';
import { publicProposalRawSchema, publicProposalSchema, type PublicProposal } from '@/schemas/public-proposal';

export async function fetchPublicProposal(token: string): Promise<PublicProposal | null> {
  const client = await createClient();

  const { data, error } = await client.rpc('get_public_proposal', {
    p_token_hash: hashToken(token),
  });

  if (error || data === null) {
    return null;
  }

  const raw = publicProposalRawSchema.safeParse(data);
  if (!raw.success) {
    return null;
  }

  const parsed = publicProposalSchema.safeParse(toPublicProposal(raw.data));
  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}