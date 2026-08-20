import { NextResponse } from 'next/server';
import { fetchPublicProposal } from '@/lib/proposals/public-proposal';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const proposal = await fetchPublicProposal(token);

  if (proposal === null) {
    return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 });
  }

  return NextResponse.json(proposal);
}