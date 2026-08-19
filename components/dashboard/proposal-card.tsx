import type { ProposalListItem } from '@/lib/proposals/dashboard-queries';
import { StatusBadge } from '@/components/dashboard/status-badge';

function formatAmount(cents: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function ProposalCard({ proposal }: { proposal: ProposalListItem }) {
  return (
    <article className="rounded-lg border border-foreground/10 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-card-foreground">{proposal.title || 'Sem título'}</h3>
        <StatusBadge status={proposal.status} />
      </div>
      <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <dt>Valor base</dt>
          <dd>{formatAmount(proposal.baseAmount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Validade</dt>
          <dd>
            {proposal.expiresAt
              ? new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short' }).format(
                  new Date(proposal.expiresAt)
                )
              : '—'}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Criada a</dt>
          <dd>
            {new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short' }).format(
              new Date(proposal.createdAt)
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}