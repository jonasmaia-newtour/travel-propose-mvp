import { requireRole } from '@/lib/auth/guards';
import { getDashboardData } from '@/lib/proposals/dashboard-queries';
import { MetricsCards } from '@/components/dashboard/metrics-cards';
import { KanbanBoard } from '@/components/dashboard/kanban-board';

export default async function DashboardPage() {
  const { user, role } = await requireRole('OWNER', 'ADMIN', 'MEMBER');
  const data = await getDashboardData({ role, userId: user.id });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">
          {role === 'MEMBER' ? 'As minhas propostas' : 'Propostas da agência'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {role === 'MEMBER' ? 'Acompanhe as propostas que criou.' : 'Visão geral do pipeline da organização.'}
        </p>
      </header>

      <MetricsCards metrics={data.metrics} />

      <section aria-labelledby="pipeline-title">
        <h2 id="pipeline-title" className="mb-3 text-lg font-medium text-foreground">
          Pipeline
        </h2>
        {data.proposals.length === 0 ? (
          <div className="rounded-lg border border-dashed border-foreground/20 p-12 text-center">
            <p className="text-muted-foreground">Ainda não há propostas.</p>
          </div>
        ) : (
          <KanbanBoard
            countsByStatus={data.countsByStatus}
            proposals={data.proposals}
          />
        )}
      </section>
    </div>
  );
}