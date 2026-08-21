'use client';

import { useEffect, useRef, useState } from 'react';
import type { PublicProposal } from '@/schemas/public-proposal';
import {
  calculatePublicTotal,
  type PublicSelection,
} from '@/domain/proposal/public-pricing';
import { formatCurrency, formatShortDate } from '@/lib/i18n/format';
import { PublicActions } from '@/components/proposal/public-actions';
import { getPublicSessionId } from '@/lib/proposals/public-session';
import { Card } from '@/components/ui/card';
import { CalendarBlank, Check, ShieldCheck } from '@phosphor-icons/react';

function getDevice(): string | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mobi')) return 'mobile';
  return 'desktop';
}

function initialSelection(proposal: PublicProposal): PublicSelection {
  return proposal.sections.map((section) => (section.mode === 'single' ? [0] : []));
}

function formatDelta(priceDelta: number): string {
  if (priceDelta === 0) {
    return 'Incluído';
  }
  const value = formatCurrency(Math.abs(priceDelta));
  return priceDelta > 0 ? `+${value}` : `-${value}`;
}

export function PublicSimulator({
  proposal,
  token,
}: {
  proposal: PublicProposal;
  token: string;
}) {
  const [selection, setSelection] = useState<PublicSelection>(() => initialSelection(proposal));
  const openedSentRef = useRef(false);
  const firstSelectionRef = useRef(true);

  useEffect(() => {
    if (openedSentRef.current) return;
    openedSentRef.current = true;
    const controller = new AbortController();
    fetch(`/api/v1/public/proposals/${token}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'opened',
        sessionId: getPublicSessionId(),
        device: getDevice(),
      }),
      signal: controller.signal,
    }).catch(() => {});
    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    if (firstSelectionRef.current) {
      firstSelectionRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      fetch(`/api/v1/public/proposals/${token}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'selection_changed',
          sessionId: getPublicSessionId(),
          payload: { selection },
          device: getDevice(),
        }),
      }).catch(() => {});
    }, 500);
    return () => window.clearTimeout(timer);
  }, [selection, token]);

  function chooseSingle(sectionIndex: number, itemIndex: number) {
    setSelection((current) =>
      current.map((selected, index) => (index === sectionIndex ? [itemIndex] : selected))
    );
  }

  function toggleMultiple(sectionIndex: number, itemIndex: number) {
    setSelection((current) =>
      current.map((selected, index) =>
        index === sectionIndex
          ? selected.includes(itemIndex)
            ? selected.filter((item) => item !== itemIndex)
            : [...selected, itemIndex]
          : selected
      )
    );
  }

  const baseAmount = proposal.baseAmount;
  const total = calculatePublicTotal(baseAmount, proposal.sections, selection);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 px-4 py-12 pb-36">
      <header className="space-y-4 text-center border-b border-border pb-8">
        {proposal.agency.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- logotipo de CDN externo da agência
          <img src={proposal.agency.logoUrl} alt="" className="mx-auto h-12 w-auto object-contain" />
        ) : null}
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-gray">
          {proposal.agency.name}
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold text-royal-blue tracking-tight">
          {proposal.title}
        </h1>
        <div className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-slate-gray">
          <CalendarBlank size={14} weight="regular" />
          <span>Proposta válida até {formatShortDate(proposal.expiresAt)}</span>
        </div>
      </header>

      {proposal.terms ? (
        <Card className="p-6 bg-slate-50/50 border-border">
          <div className="flex items-center gap-2 font-semibold text-royal-blue mb-2">
            <ShieldCheck size={18} weight="regular" />
            <h2>Condições da Proposta</h2>
          </div>
          <p className="text-sm text-slate-gray leading-relaxed">{proposal.terms}</p>
        </Card>
      ) : null}

      <div className="space-y-8">
        {proposal.sections.map((section, sectionIndex) => (
          <fieldset key={sectionIndex} className="space-y-4">
            <div className="flex items-baseline justify-between">
              <legend className="text-xl font-semibold text-royal-blue">{section.title}</legend>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-gray">
                {section.mode === 'single' ? 'Escolha única' : 'Escolha múltipla'}
              </span>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {section.items.map((item, itemIndex) => {
                const selected =
                  section.mode === 'single'
                    ? (selection[sectionIndex] ?? [])[0] === itemIndex
                    : (selection[sectionIndex] ?? []).includes(itemIndex);

                return (
                  <li key={itemIndex}>
                    <Card
                      role="button"
                      tabIndex={0}
                      aria-pressed={selected}
                      onClick={() => {
                        if (section.mode === 'single') {
                          chooseSingle(sectionIndex, itemIndex);
                        } else {
                          toggleMultiple(sectionIndex, itemIndex);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          if (section.mode === 'single') {
                            chooseSingle(sectionIndex, itemIndex);
                          } else {
                            toggleMultiple(sectionIndex, itemIndex);
                          }
                        }
                      }}
                      className={`cursor-pointer overflow-hidden p-5 transition-all flex flex-col justify-between h-full ${
                        selected
                          ? 'border-2 border-royal-blue ring-2 ring-royal-blue/10 bg-blue-50/20'
                          : 'border border-border hover:border-royal-blue/30 bg-white'
                      }`}
                    >
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- imagem opcional do item
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="mb-4 h-36 w-full rounded-md object-cover"
                        />
                      ) : null}
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className="font-semibold text-foreground text-base leading-snug">
                            {item.title}
                          </span>
                          <span className="shrink-0 text-sm font-semibold text-royal-blue bg-muted/60 px-2.5 py-0.5 rounded-full">
                            {formatDelta(item.priceDelta)}
                          </span>
                        </div>
                        {item.description ? (
                          <p className="text-sm text-slate-gray leading-relaxed mb-4">
                            {item.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border/60 mt-auto">
                        <span className="text-xs font-medium text-slate-gray">
                          {selected ? 'Selecionado' : 'Clique para selecionar'}
                        </span>
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            selected
                              ? 'border-royal-blue bg-royal-blue text-white'
                              : 'border-border bg-white'
                          }`}
                        >
                          {selected ? <Check size={12} weight="bold" /> : null}
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-border shadow-lg py-4 px-6">
        <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-gray">Valor Base</p>
              <p className="text-sm font-medium text-foreground">{formatCurrency(baseAmount)}</p>
            </div>
            <div className="hidden sm:block h-8 w-px bg-border" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-gray">Total Estimado</p>
              <p className="text-xl font-bold text-royal-blue" data-testid="simulator-total">
                {formatCurrency(total)}
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <PublicActions proposal={proposal} selection={selection} token={token} />
          </div>
        </div>
      </div>
    </div>
  );
}
