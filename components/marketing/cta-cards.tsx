import Link from 'next/link';
import { ptPT } from '@/lib/i18n/pt-PT';

const DEMO_PROPOSAL_TOKEN = 'travelpropose-demo-2026';

export function CtaCards() {
  const { login, dashboard, proposal } = ptPT.landing.cta;

  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Ações principais">
      <li className="rounded-lg border border-foreground/10 bg-secondary/50 p-6">
        <h2 className="text-base font-semibold">{login.title}</h2>
        <p className="mt-2 text-sm text-foreground/70">{login.description}</p>
        <Link
          href={login.href}
          className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {login.label}
        </Link>
      </li>
      <li className="rounded-lg border border-foreground/10 bg-secondary/50 p-6">
        <h2 className="text-base font-semibold">{dashboard.title}</h2>
        <p className="mt-2 text-sm text-foreground/70">{dashboard.description}</p>
        <Link
          href={dashboard.href}
          className="mt-4 inline-block rounded-md border border-foreground/20 px-4 py-2 text-sm font-medium text-foreground"
        >
          {dashboard.label}
        </Link>
      </li>
      <li className="rounded-lg border border-foreground/10 bg-secondary/50 p-6">
        <h2 className="text-base font-semibold">{proposal.title}</h2>
        <p className="mt-2 text-sm text-foreground/70">{proposal.description}</p>
        <Link
          href={`/p/${DEMO_PROPOSAL_TOKEN}`}
          className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          {proposal.label}
        </Link>
      </li>
    </ul>
  );
}
