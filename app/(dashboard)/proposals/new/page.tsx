import { requireRole } from '@/lib/auth/guards';
import { createDraftAction } from '@/app/(dashboard)/proposals/actions';

export default async function NewProposalPage() {
  await requireRole('MEMBER');

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Nova proposta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Comece um rascunho, adicione secções de escolha e publique quando estiver pronto.
        </p>
      </header>
      <form action={createDraftAction}>
        <button
          type="submit"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Começar rascunho
        </button>
      </form>
    </div>
  );
}