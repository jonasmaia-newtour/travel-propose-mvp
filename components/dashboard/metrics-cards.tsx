import type { DashboardMetrics } from '@/lib/proposals/dashboard-queries';

function formatCount(value: number): string {
  return new Intl.NumberFormat('pt-PT').format(value);
}

export function MetricsCards({ metrics }: { metrics: DashboardMetrics }) {
  const items: Array<{ label: string; value: number }> = [
    { label: 'Total de propostas', value: metrics.total },
    { label: 'Publicadas (em curso)', value: metrics.published },
    { label: 'Aprovadas', value: metrics.approved },
    { label: 'Pedidos de ajuste', value: metrics.pendingRevision },
  ];

  return (
    <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <li
          key={item.label}
          className="rounded-lg border border-foreground/10 bg-card p-4"
        >
          <p className="text-sm text-muted-foreground">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold text-card-foreground">
            {formatCount(item.value)}
          </p>
        </li>
      ))}
    </ul>
  );
}