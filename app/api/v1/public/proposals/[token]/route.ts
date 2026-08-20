import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hashToken } from '@/lib/proposals/publish-service';
import { toPublicProposal } from '@/domain/proposal/public-representation';
import { publicProposalRawSchema, publicProposalSchema } from '@/schemas/public-proposal';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const client = await createClient();

  const { data, error } = await client.rpc('get_public_proposal', {
    p_token_hash: hashToken(token),
  });

  if (error || data === null) {
    return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 });
  }

  const raw = publicProposalRawSchema.safeParse(data);
  if (!raw.success) {
    return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 });
  }

  const parsed = publicProposalSchema.safeParse(toPublicProposal(raw.data));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 });
  }

  return NextResponse.json(parsed.data);
}