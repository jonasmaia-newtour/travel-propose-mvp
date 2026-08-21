'use client';

import type { DashboardMetrics } from '@/lib/proposals/dashboard-queries';
import { Card } from '@/components/ui/card';
import { 
  FolderOpen, 
  PaperPlaneTilt, 
  CheckCircle, 
  ArrowCounterClockwise, 
  Eye, 
  Lightning 
} from '@phosphor-icons/react';

function formatCount(value: number): string {
  return new Intl.NumberFormat('pt-PT').format(value);
}

export function MetricsCards({ metrics }: { metrics: DashboardMetrics }) {
  const items = [
    { label: 'Total de propostas', value: metrics.total, icon: FolderOpen, color: 'text-royal-blue' },
    { label: 'Publicadas (em curso)', value: metrics.published, icon: PaperPlaneTilt, color: 'text-royal-blue' },
    { label: 'Aprovadas', value: metrics.approved, icon: CheckCircle, color: 'text-aqua-green' },
    { label: 'Pedidos de ajuste', value: metrics.pendingRevision, icon: ArrowCounterClockwise, color: 'text-amber-600' },
    { label: 'Visualizações', value: metrics.views, icon: Eye, color: 'text-muted-foreground' },
    { label: 'Interações', value: metrics.interactions, icon: Lightning, color: 'text-muted-foreground' },
  ];

  return (
    <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.label}>
            <Card className="p-5 flex flex-col justify-between h-full bg-white hover:border-royal-blue/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-gray">
                  {item.label}
                </span>
                <Icon size={20} weight="regular" className={item.color} />
              </div>
              <p className="text-3xl font-bold tracking-tight text-royal-blue">
                {formatCount(item.value)}
              </p>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
