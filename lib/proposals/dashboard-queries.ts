import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/supabase/types';
import type { ProposalStatus } from '@/domain/proposal/state-machine';

export const DASHBOARD_PAGE_SIZE = 20;

export interface DashboardContext {
  role: UserRole;
  userId: string;
}

export interface ProposalListItem {
  id: string;
  title: string;
  status: ProposalStatus;
  baseAmount: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface DashboardMetrics {
  total: number;
  published: number;
  approved: number;
  pendingRevision: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  countsByStatus: Record<ProposalStatus, number>;
  proposals: ProposalListItem[];
}

const proposalSelect = 'id, title, status, base_amount, expires_at, created_at';

function mapProposal(row: {
  id: string;
  title: string;
  status: ProposalStatus;
  base_amount: number;
  expires_at: string | null;
  created_at: string;
}): ProposalListItem {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    baseAmount: row.base_amount,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export async function getDashboardData(context: DashboardContext): Promise<DashboardData> {
  const client = await createClient();
  let query = client.from('proposals').select(proposalSelect);
  if (context.role === 'MEMBER') {
    query = query.eq('owner_id', context.userId);
  }
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error('Não foi possível carregar as propostas.');

  const proposals = (data ?? []).map(mapProposal);
  const countsByStatus = {
    draft: 0,
    sent: 0,
    viewed: 0,
    revision_requested: 0,
    approved: 0,
    expired: 0,
  } satisfies Record<ProposalStatus, number>;
  for (const proposal of proposals) {
    countsByStatus[proposal.status] += 1;
  }

  return {
    metrics: {
      total: proposals.length,
      published: countsByStatus.sent + countsByStatus.viewed,
      approved: countsByStatus.approved,
      pendingRevision: countsByStatus.revision_requested,
    },
    countsByStatus,
    proposals,
  };
}

export async function getProposalsPage(
  context: DashboardContext,
  page = 1,
  status?: ProposalStatus
): Promise<{ proposals: ProposalListItem[]; total: number; page: number; pageSize: number }> {
  const client = await createClient();
  let query = client
    .from('proposals')
    .select(proposalSelect, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (context.role === 'MEMBER') {
    query = query.eq('owner_id', context.userId);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const from = (page - 1) * DASHBOARD_PAGE_SIZE;
  const to = from + DASHBOARD_PAGE_SIZE - 1;
  const { data, count, error } = await query.range(from, to);

  if (error) throw new Error('Não foi possível carregar as propostas.');

  return {
    proposals: (data ?? []).map(mapProposal),
    total: count ?? 0,
    page,
    pageSize: DASHBOARD_PAGE_SIZE,
  };
}