'use client';

import type { ProposalListItem } from '@/lib/proposals/dashboard-queries';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Card } from '@/components/ui/card';
import { CurrencyEur, CalendarBlank } from '@phosphor-icons/react';

function formatAmount(cents: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function ProposalCard({ proposal }: { proposal: ProposalListItem }) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-royal-blue text-base leading-tight">
          {proposal.title || 'Sem título'}
        </h3>
        <StatusBadge status={proposal.status} />
      </div>
      <dl className="space-y-2 text-sm text-slate-gray">
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-1.5">
            <CurrencyEur size={16} weight="regular" className="text-royal-blue" />
            <span>Valor base</span>
          </dt>
          <dd className="font-medium text-foreground">{formatAmount(proposal.baseAmount)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-1.5">
            <CalendarBlank size={16} weight="regular" className="text-slate-gray" />
            <span>Validade</span>
          </dt>
          <dd>
            {proposal.expiresAt
              ? new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short' }).format(
                  new Date(proposal.expiresAt)
                )
              : '—'}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
