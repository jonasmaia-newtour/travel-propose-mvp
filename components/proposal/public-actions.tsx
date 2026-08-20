'use client';

import { useEffect, useState } from 'react';
import type { PublicProposal } from '@/schemas/public-proposal';
import type { PublicSelection } from '@/domain/proposal/public-pricing';
import { getPublicSessionId } from '@/lib/proposals/public-session';
import { AdjustmentDialog } from '@/components/proposal/adjustment-dialog';
import {
  ApprovalReceiptDialog,
  type PublicReceipt,
} from '@/components/proposal/approval-receipt-dialog';

/**
 * Ações públicas da proposta (T046): aprovação e pedido de ajuste com os
 * respetivos diálogos, mais o aviso de expiração (prazo termina durante a
 * navegação ou o servidor devolve 409 expired). A fonte de verdade do total
 * é o servidor; o cliente apenas apresenta o recibo devolvido.
 */
interface PublicActionsProps {
  proposal: PublicProposal;
  selection: PublicSelection;
  token: string;
}

type ApprovalStatus = 'idle' | 'submitting' | 'success' | 'error';

export function PublicActions({ proposal, selection, token }: PublicActionsProps) {
  const [expired, setExpired] = useState(
    () => Date.now() > new Date(proposal.expiresAt).getTime(),
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('idle');
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PublicReceipt | null>(null);

  useEffect(() => {
    if (expired) {
      return;
    }
    const timer = window.setTimeout(
      () => setExpired(true),
      new Date(proposal.expiresAt).getTime() - Date.now(),
    );
    return () => window.clearTimeout(timer);
  }, [expired, proposal.expiresAt]);

  async function approve() {
    if (proposal.terms !== null && !termsAccepted) {
      return;
    }
    setApprovalStatus('submitting');
    setApprovalError(null);
    try {
      const response = await fetch(`/api/v1/public/proposals/${token}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selection,
          termsVersion: proposal.termsVersion,
          termsAccepted: proposal.terms === null ? true : termsAccepted,
          sessionId: getPublicSessionId(),
        }),
      });

      if (response.status === 201) {
        const data = (await response.json()) as PublicReceipt;
        setReceipt(data);
        setApprovalStatus('success');
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; code?: string }
        | null;

      if (response.status === 409 && payload?.code === 'expired') {
        setExpired(true);
        setApprovalStatus('idle');
        return;
      }

      setApprovalError(payload?.error ?? 'Não foi possível aprovar a proposta.');
      setApprovalStatus('error');
    } catch {
      setApprovalError(
        'Não foi possível aprovar a proposta. Verifique a ligação e tente novamente.',
      );
      setApprovalStatus('error');
    }
  }

  if (expired) {
    return (
      <section
        role="status"
        aria-live="polite"
        className="rounded-lg border border-destructive/30 bg-destructive/5 p-4"
      >
        <h2 className="font-semibold">A proposta expirou</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          O prazo de validade terminou. Peça uma nova proposta à agência.
        </p>
      </section>
    );
  }

  const termsMissing = proposal.terms !== null && !termsAccepted;

  return (
    <section aria-label="Confirmar proposta" className="space-y-4">
      {proposal.terms !== null ? (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className="mt-0.5 size-4 accent-accent"
          />
          <span>Aceito as condições apresentadas na proposta.</span>
        </label>
      ) : null}

      {approvalStatus === 'error' && approvalError !== null ? (
        <p role="alert" className="text-sm text-destructive">
          {approvalError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={approve}
          disabled={termsMissing || approvalStatus === 'submitting'}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {approvalStatus === 'submitting' ? 'A aprovar…' : 'Aprovar proposta'}
        </button>
        <button
          type="button"
          onClick={() => setAdjustmentOpen(true)}
          className="rounded-md border border-foreground/20 px-4 py-2 text-sm font-medium"
        >
          Pedir ajuste
        </button>
      </div>

      {adjustmentOpen ? (
        <AdjustmentDialog
          open
          token={token}
          onClose={() => setAdjustmentOpen(false)}
          onSubmitted={() => setAdjustmentOpen(false)}
        />
      ) : null}

      {receipt !== null ? (
        <ApprovalReceiptDialog open receipt={receipt} onClose={() => setReceipt(null)} />
      ) : null}
    </section>
  );
}