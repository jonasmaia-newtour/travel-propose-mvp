'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { publishAction, saveDraftAction } from '@/app/(dashboard)/proposals/actions';
import { SectionEditor, type EditorSection } from '@/components/proposal/editor/section-editor';
import { SubmitButton } from '@/components/proposal/editor/submit-button';

export interface EditorInitialData {
  title: string;
  baseAmount: number;
  expiresAt: string | null;
  notes: string | null;
  sections: Array<{
    key: string;
    title: string;
    mode: 'single' | 'multiple';
    items: Array<{
      key: string;
      title: string;
      description: string | null;
      imageUrl: string | null;
      priceDelta: number;
    }>;
  }>;
}

const inputClass =
  'w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground';

function toLocalInputValue(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function ProposalEditor({
  proposalId,
  initial,
}: {
  proposalId: string;
  initial: EditorInitialData;
}) {
  const [title, setTitle] = useState(initial.title);
  const [baseAmountCents, setBaseAmountCents] = useState(initial.baseAmount);
  const [expiresAt, setExpiresAt] = useState(toLocalInputValue(initial.expiresAt));
  const [notes, setNotes] = useState(initial.notes ?? '');
  const [sections, setSections] = useState<EditorSection[]>(
    initial.sections.map((section) => ({
      key: section.key,
      title: section.title,
      mode: section.mode,
      items: section.items.map((item) => ({
        key: item.key,
        title: item.title,
        description: item.description ?? '',
        imageUrl: item.imageUrl ?? '',
        priceDeltaCents: item.priceDelta,
      })),
    }))
  );

  const [saveState, saveFormAction] = useActionState(saveDraftAction.bind(null, proposalId), null);
  const [publishState, publishFormAction] = useActionState(
    publishAction.bind(null, proposalId),
    null
  );

  const payload = JSON.stringify({
    title,
    base_amount: baseAmountCents,
    expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    notes: notes || undefined,
    sections: sections.map((section, sectionIndex) => ({
      title: section.title,
      mode: section.mode,
      order: sectionIndex,
      items: section.items.map((item) => ({
        title: item.title,
        description: item.description || undefined,
        image_url: item.imageUrl || undefined,
        price_delta: item.priceDeltaCents,
      })),
    })),
  });

  const errorMessage = saveState?.error ?? publishState?.error;

  return (
    <form action={saveFormAction} className="space-y-6">
      <input type="hidden" name="payload" value={payload} />

      <div className="space-y-4">
        <div>
          <label htmlFor="proposal-title" className="mb-1 block text-sm text-foreground">
            Título da proposta
          </label>
          <input
            id="proposal-title"
            type="text"
            required
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="proposal-base" className="mb-1 block text-sm text-foreground">
              Valor base (€)
            </label>
            <input
              id="proposal-base"
              type="number"
              min="0"
              step="0.01"
              required
              value={(baseAmountCents / 100).toFixed(2)}
              onChange={(event) =>
                setBaseAmountCents(Math.round((Number(event.target.value) || 0) * 100))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="proposal-expires" className="mb-1 block text-sm text-foreground">
              Validade
            </label>
            <input
              id="proposal-expires"
              type="datetime-local"
              required
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label htmlFor="proposal-notes" className="mb-1 block text-sm text-foreground">
            Observações
          </label>
          <textarea
            id="proposal-notes"
            rows={3}
            maxLength={1000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-4">
        {sections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ainda não há secções. Adicione a primeira para começar.
          </p>
        ) : (
          sections.map((section) => (
            <SectionEditor
              key={section.key}
              section={section}
              onChange={(next) =>
                setSections(sections.map((current) => (current.key === next.key ? next : current)))
              }
              onRemove={() => setSections(sections.filter((current) => current.key !== section.key))}
            />
          ))
        )}
        <button
          type="button"
          onClick={() =>
            setSections([
              ...sections,
              { key: crypto.randomUUID(), title: '', mode: 'single', items: [] },
            ])
          }
          className="rounded-md border border-foreground/20 px-3 py-2 text-sm text-foreground"
        >
          Adicionar secção
        </button>
      </div>

      {errorMessage ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground"
        >
          {errorMessage}
        </p>
      ) : null}

      {publishState?.token ? (
        <div className="rounded-md border border-foreground/10 bg-muted/30 p-4">
          <p className="text-sm font-medium text-foreground">Proposta publicada!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Link público para o viajante (guarde-o; só é mostrado agora):
          </p>
          <a
            href={`/p/${publishState.token}`}
            className="mt-1 block break-all text-sm text-foreground underline"
          >
            /p/{publishState.token}
          </a>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <SubmitButton label="Guardar rascunho" pendingLabel="A guardar…" />
        <button
          type="submit"
          formAction={publishFormAction}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
        >
          Publicar
        </button>
      </div>
    </form>
  );
}