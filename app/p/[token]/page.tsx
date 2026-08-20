import { notFound } from 'next/navigation';
import { fetchPublicProposal } from '@/lib/proposals/public-proposal';
import { PublicProposalView } from '@/components/proposal/public-proposal-view';

export const dynamic = 'force-dynamic';

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const proposal = await fetchPublicProposal(token);

  if (proposal === null) {
    notFound();
  }

  return <PublicProposalView proposal={proposal} />;
}