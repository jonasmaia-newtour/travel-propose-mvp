'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { publishAction, saveDraftAction } from '@/app/(dashboard)/proposals/actions';
import { SectionEditor, type EditorSection } from '@/components/proposal/editor/section-editor';
import { SubmitButton } from '@/components/proposal/editor/submit-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, PaperPlaneTilt, CheckCircle, Warning } from '@phosphor-icons/react';

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
    <form action={saveFormAction} className="space-y-8 max-w-4xl mx-auto">
      <input type="hidden" name="payload" value={payload} />

      <Card className="p-6 border-border shadow-xs">
        <h2 className="text-lg font-semibold text-royal-blue mb-4">Informações Gerais da Proposta</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="proposal-title" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-gray">
              Título da proposta
            </label>
            <Input
              id="proposal-title"
              type="text"
              required
              maxLength={120}
              placeholder="Ex: Viagem de Luxo a Roma e Florença"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="proposal-base" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-gray">
                Valor base (€)
              </label>
              <Input
                id="proposal-base"
                type="number"
                min="0"
                step="0.01"
                required
                value={(baseAmountCents / 100).toFixed(2)}
                onChange={(event) =>
                  setBaseAmountCents(Math.round((Number(event.target.value) || 0) * 100))
                }
              />
            </div>
            <div>
              <label htmlFor="proposal-expires" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-gray">
                Validade e expiração
              </label>
              <Input
                id="proposal-expires"
                type="datetime-local"
                required
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="proposal-notes" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-gray">
              Observações para o viajante
            </label>
            <textarea
              id="proposal-notes"
              rows={3}
              maxLength={1000}
              placeholder="Notas importantes sobre a viagem..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-blue"
            />
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-royal-blue">Secções e Opções</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setSections([
                ...sections,
                { key: crypto.randomUUID(), title: '', mode: 'single', items: [] },
              ])
            }
            className="text-royal-blue border-royal-blue/30 hover:bg-royal-blue/5"
          >
            <Plus size={16} weight="regular" className="mr-1.5" />
            Adicionar secção
          </Button>
        </div>

        {sections.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-gray border border-dashed border-border">
            Ainda não há secções. Clique em &ldquo;Adicionar secção&rdquo; para começar a estruturar a proposta.
          </Card>
        ) : (
          <div className="space-y-6">
            {sections.map((section) => (
              <SectionEditor
                key={section.key}
                section={section}
                onChange={(next) =>
                  setSections(sections.map((current) => (current.key === next.key ? next : current)))
                }
                onRemove={() => setSections(sections.filter((current) => current.key !== section.key))}
              />
            ))}
          </div>
        )}
      </div>

      {errorMessage ? (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-2">
          <Warning size={20} weight="regular" className="shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {publishState?.token ? (
        <Card className="p-5 border-emerald-200 bg-emerald-50/50">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-1">
            <CheckCircle size={20} weight="regular" className="text-aqua-green" />
            <span>Proposta publicada com sucesso!</span>
          </div>
          <p className="text-sm text-slate-gray mb-2">
            Link público para partilhar com o viajante (guarde-o; só é mostrado agora):
          </p>
          <a
            href={`/p/${publishState.token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-royal-blue underline break-all hover:text-royal-blue/80"
          >
            /p/{publishState.token}
          </a>
        </Card>
      ) : null}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <SubmitButton label="Guardar rascunho" pendingLabel="A guardar…" />
        <Button
          type="submit"
          formAction={publishFormAction}
          variant="default"
          className="bg-royal-blue hover:bg-royal-blue/90 text-white"
        >
          <PaperPlaneTilt size={16} weight="regular" className="mr-2" />
          Publicar Proposta
        </Button>
      </div>
    </form>
  );
}
