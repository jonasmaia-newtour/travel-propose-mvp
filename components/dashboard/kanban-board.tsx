import type { ProposalStatus } from '@/domain/proposal/state-machine';
import type { ProposalListItem } from '@/lib/proposals/dashboard-queries';
import { ProposalCard } from '@/components/dashboard/proposal-card';
import { statusLabels } from '@/components/dashboard/status-badge';

const columnOrder: ProposalStatus[] = [
  'draft',
  'sent',
  'viewed',
  'revision_requested',
  'approved',
  'expired',
];

export function KanbanBoard({
  countsByStatus,
  proposals,
}: {
  countsByStatus: Record<ProposalStatus, number>;
  proposals: ProposalListItem[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {columnOrder.map((status) => {
        const columnProposals = proposals.filter((proposal) => proposal.status === status);
        return (
          <section
            key={status}
            aria-label={statusLabels[status]}
            className="rounded-lg border border-foreground/10 bg-muted/30 p-4"
          >
            <header className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-card-foreground">{statusLabels[status]}</h2>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                {countsByStatus[status]}
              </span>
            </header>
            {columnProposals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem propostas.</p>
            ) : (
              <ul className="space-y-3">
                {columnProposals.map((proposal) => (
                  <li key={proposal.id}>
                    <ProposalCard proposal={proposal} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}