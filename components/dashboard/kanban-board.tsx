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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {columnOrder.map((status) => {
        const columnProposals = proposals.filter((proposal) => proposal.status === status);
        return (
          <section
            key={status}
            aria-label={statusLabels[status]}
            className="flex flex-col rounded-xl border border-border bg-slate-50/50 p-4"
          >
            <header className="mb-4 flex items-center justify-between pb-2 border-b border-border">
              <h2 className="text-sm font-semibold text-royal-blue tracking-wide uppercase">
                {statusLabels[status]}
              </h2>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-gray shadow-xs border border-border">
                {countsByStatus[status]}
              </span>
            </header>
            {columnProposals.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-sm text-slate-gray border border-dashed border-border rounded-lg bg-white/50">
                Sem propostas nesta fase.
              </div>
            ) : (
              <ul className="space-y-3 flex-1">
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
