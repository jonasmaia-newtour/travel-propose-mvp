'use client';

import type { ReactNode } from 'react';
import type { ProposalStatus } from '@/domain/proposal/state-machine';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  PaperPlaneTilt, 
  Eye, 
  ArrowCounterClockwise, 
  CheckCircle, 
  Clock 
} from '@phosphor-icons/react';

const statusLabels: Record<ProposalStatus, string> = {
  draft: 'Rascunho',
  sent: 'Enviada',
  viewed: 'Vista',
  revision_requested: 'Ajuste pedido',
  approved: 'Aprovada',
  expired: 'Expirada',
};

const statusVariants: Record<ProposalStatus, "secondary" | "default" | "success" | "warning" | "destructive"> = {
  draft: 'secondary',
  sent: 'default',
  viewed: 'default',
  revision_requested: 'warning',
  approved: 'success',
  expired: 'destructive',
};

export function StatusBadge({ status }: { status: ProposalStatus }) {
  const iconProps = { size: 14, weight: "regular" as const, className: "mr-1 inline-block" };
  
  const iconMap: Record<ProposalStatus, ReactNode> = {
    draft: <FileText {...iconProps} />,
    sent: <PaperPlaneTilt {...iconProps} />,
    viewed: <Eye {...iconProps} />,
    revision_requested: <ArrowCounterClockwise {...iconProps} />,
    approved: <CheckCircle {...iconProps} />,
    expired: <Clock {...iconProps} />,
  };

  return (
    <Badge variant={statusVariants[status]} className="font-medium">
      {iconMap[status]}
      {statusLabels[status]}
    </Badge>
  );
}

export { statusLabels };
