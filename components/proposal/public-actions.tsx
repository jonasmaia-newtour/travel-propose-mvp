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
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowCounterClockwise, Clock } from '@phosphor-icons/react';

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
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
      >
        <Clock size={20} weight="regular" className="text-red-600 shrink-0" />
        <span>A proposta expirou. O prazo de validade terminou.</span>
      </div>
    );
  }

  const termsMissing = proposal.terms !== null && !termsAccepted;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
      {proposal.terms !== null ? (
        <label className="flex items-center gap-2 text-xs text-slate-gray">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className="size-4 rounded border-border text-royal-blue focus:ring-royal-blue"
          />
          <span>Aceito as condições</span>
        </label>
      ) : null}

      {approvalStatus === 'error' && approvalError !== null ? (
        <p role="alert" className="text-xs text-red-600">
          {approvalError}
        </p>
      ) : null}

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAdjustmentOpen(true)}
          className="border-border text-foreground hover:bg-muted/50"
        >
          <ArrowCounterClockwise size={16} weight="regular" className="mr-1.5" />
          Pedir ajuste
        </Button>
        <Button
          type="button"
          onClick={approve}
          disabled={termsMissing || approvalStatus === 'submitting'}
          variant="success"
          size="default"
          className="bg-aqua-green hover:bg-aqua-green/90 text-white font-semibold"
        >
          <CheckCircle size={18} weight="regular" className="mr-2" />
          {approvalStatus === 'submitting' ? 'A aprovar…' : 'Aprovar proposta'}
        </Button>
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
    </div>
  );
}
