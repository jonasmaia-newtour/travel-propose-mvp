/**
 * Máquina de estados das propostas.
 * draft -> sent -> viewed -> revision_requested -> draft
 * sent | viewed -> approved | expired
 * approved e expired são estados terminais no MVP.
 */
export type ProposalStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'revision_requested'
  | 'approved'
  | 'expired';

export type ProposalEvent =
  | 'publish'
  | 'open'
  | 'request_adjustment'
  | 'resume_editing'
  | 'approve'
  | 'expire';

const transitions: Record<ProposalStatus, Partial<Record<ProposalEvent, ProposalStatus>>> = {
  draft: { publish: 'sent' },
  sent: {
    open: 'viewed',
    request_adjustment: 'revision_requested',
    approve: 'approved',
    expire: 'expired',
  },
  viewed: {
    request_adjustment: 'revision_requested',
    approve: 'approved',
    expire: 'expired',
  },
  revision_requested: { resume_editing: 'draft' },
  approved: {},
  expired: {},
};

export function canTransition(state: ProposalStatus, event: ProposalEvent): boolean {
  return transitions[state][event] !== undefined;
}

export function transition(state: ProposalStatus, event: ProposalEvent): ProposalStatus {
  const next = transitions[state][event];
  if (next === undefined) {
    throw new Error(`Transição inválida: ${state} -> ${event}.`);
  }
  return next;
}

export function isTerminal(state: ProposalStatus): boolean {
  return state === 'approved' || state === 'expired';
}

export function isExpired(expiresAt: Date, now: Date): boolean {
  return expiresAt.getTime() <= now.getTime();
}