import type { ProposalStatus } from '@/domain/proposal/state-machine';

const statusLabels: Record<ProposalStatus, string> = {
  draft: 'Rascunho',
  sent: 'Enviada',
  viewed: 'Vista',
  revision_requested: 'Ajuste pedido',
  approved: 'Aprovada',
  expired: 'Expirada',
};

export function StatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <span className="inline-flex items-center rounded-full border border-foreground/20 px-2.5 py-0.5 text-xs font-medium text-foreground/80">
      {statusLabels[status]}
    </span>
  );
}

export { statusLabels };