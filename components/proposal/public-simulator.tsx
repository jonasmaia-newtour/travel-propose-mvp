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
  const deltas = proposal.sections.flatMap((section, sectionIndex) =>
    (selection[sectionIndex] ?? []).map((itemIndex) => section.items[itemIndex]?.priceDelta ?? 0)
  );
  const selectedDeltas = deltas.reduce((sum, delta) => sum + delta, 0);
  const total = calculatePublicTotal(baseAmount, proposal.sections, selection);

  return (
    <div className="mx-auto w-full max-w-xl space-y-8 px-4 py-6">
      <header className="space-y-2">
        {proposal.agency.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- logotipo de CDN externo da agência
          <img src={proposal.agency.logoUrl} alt="" className="h-10 w-auto" />
        ) : null}
        <p className="text-sm font-medium text-accent-foreground">{proposal.agency.name}</p>
        <h1 className="text-2xl font-semibold">{proposal.title}</h1>
        <p className="text-sm text-muted-foreground">
          Proposta válida até {formatShortDate(proposal.expiresAt)}
        </p>
      </header>

      {proposal.terms ? (
        <section aria-label="Condições" className="rounded-lg border border-foreground/10 bg-card p-4">
          <h2 className="text-sm font-semibold">Condições</h2>
          <p className="mt-2 text-sm text-muted-foreground">{proposal.terms}</p>
        </section>
      ) : null}

      <div className="space-y-8">
        {proposal.sections.map((section, sectionIndex) => (
          <fieldset key={sectionIndex}>
            <legend className="text-lg font-semibold">{section.title}</legend>
            <p className="mt-1 text-xs text-muted-foreground">
              {section.mode === 'single' ? 'Escolha uma opção' : 'Escolha uma ou mais opções'}
            </p>
            <ul className="mt-3 space-y-3">
              {section.items.map((item, itemIndex) => {
                const selected =
                  section.mode === 'single'
                    ? (selection[sectionIndex] ?? [])[0] === itemIndex
                    : (selection[sectionIndex] ?? []).includes(itemIndex);
                const inputId = `proposta-${sectionIndex}-item-${itemIndex}`;

                return (
                  <li
                    key={itemIndex}
                    className="rounded-lg border border-foreground/10 bg-card p-4"
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- imagem opcional do item
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="mb-3 h-32 w-full rounded-md object-cover"
                      />
                    ) : null}
                    <div className="flex items-start gap-3">
                      {section.mode === 'single' ? (
                        <input
                          id={inputId}
                          type="radio"
                          name={`seccao-${sectionIndex}`}
                          checked={selected}
                          onChange={() => chooseSingle(sectionIndex, itemIndex)}
                          className="mt-1 size-4 accent-accent"
                        />
                      ) : (
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleMultiple(sectionIndex, itemIndex)}
                          className="mt-1 size-4 accent-accent"
                        />
                      )}
                      <label htmlFor={inputId} className="flex-1">
                        <span className="flex items-start justify-between gap-3">
                          <span className="font-medium">{item.title}</span>
                          <span className="shrink-0 text-sm font-medium">
                            {formatDelta(item.priceDelta)}
                          </span>
                        </span>
                        {item.description ? (
                          <span className="mt-1 block text-sm text-muted-foreground">
                            {item.description}
                          </span>
                        ) : null}
                      </label>
                    </div>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}
      </div>

      <footer className="border-t border-foreground/10 pt-4" aria-live="polite">
        <dl className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Valor base</dt>
            <dd>{formatCurrency(baseAmount)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Opções selecionadas</dt>
            <dd>
              {selectedDeltas === 0
                ? 'Sem alteração'
                : `${selectedDeltas > 0 ? '+' : '-'}${formatCurrency(Math.abs(selectedDeltas))}`}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-foreground/10 pt-2 text-base font-semibold">
            <dt>Total estimado</dt>
            <dd data-testid="simulator-total">{formatCurrency(total)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">
          Total indicativo com base nas opções escolhidas; o valor final é confirmado pela agência.
        </p>
      </footer>

      <PublicActions proposal={proposal} selection={selection} token={token} />
    </div>
  );
}