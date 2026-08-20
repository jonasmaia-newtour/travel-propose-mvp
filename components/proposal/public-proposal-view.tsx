import type { PublicProposal } from '@/schemas/public-proposal';
import { formatCurrency, formatShortDate } from '@/lib/i18n/format';

function formatDelta(priceDelta: number): string {
  if (priceDelta === 0) {
    return 'Incluído';
  }
  const value = formatCurrency(Math.abs(priceDelta));
  return priceDelta > 0 ? `+${value}` : `-${value}`;
}

export function PublicProposalView({ proposal }: { proposal: PublicProposal }) {
  return (
    <div className="mx-auto w-full max-w-xl space-y-8 px-4 py-6">
      <header className="space-y-2">
        {proposal.agency.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- logotipo de CDN externo da agência
          <img
            src={proposal.agency.logoUrl}
            alt=""
            className="h-10 w-auto"
          />
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
        {proposal.sections.map((section, index) => (
          <section key={index} aria-label={section.title}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <ul className="mt-3 space-y-3">
              {section.items.map((item, itemIndex) => (
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
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium">{item.title}</h3>
                    <span className="shrink-0 text-sm font-medium">{formatDelta(item.priceDelta)}</span>
                  </div>
                  {item.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="border-t border-foreground/10 pt-4">
        <dl className="flex items-center justify-between text-sm">
          <dt className="text-muted-foreground">Valor base</dt>
          <dd className="font-medium">{formatCurrency(proposal.baseAmount)}</dd>
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">
          O valor final depende das opções que escolher nesta proposta.
        </p>
      </footer>
    </div>
  );
}