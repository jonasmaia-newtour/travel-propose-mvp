import Link from 'next/link';
import { requireRole } from '@/lib/auth/guards';
import { getDraft } from '@/lib/proposals/draft-service';
import { ProposalEditor } from '@/components/proposal/editor/editor-form';

export default async function EditProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireRole('MEMBER');
  const { id } = await params;
  const draft = await getDraft(id, user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Editar proposta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {draft.title || 'Rascunho sem título'}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm text-foreground"
        >
          Voltar ao dashboard
        </Link>
      </header>
      <ProposalEditor
        proposalId={draft.id}
        initial={{
          title: draft.title,
          baseAmount: draft.baseAmount,
          expiresAt: draft.expiresAt,
          notes: draft.notes,
          sections: draft.sections.map((section) => ({
            key: section.id,
            title: section.title,
            mode: section.mode,
            items: section.items.map((item) => ({
              key: item.id,
              title: item.title,
              description: item.description,
              imageUrl: item.imageUrl,
              priceDelta: item.priceDelta,
            })),
          })),
        }}
      />
    </div>
  );
}