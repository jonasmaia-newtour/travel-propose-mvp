'use client';

import Link from 'next/link';
import { ptPT } from '@/lib/i18n/pt-PT';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SignIn, Kanban, Eye } from '@phosphor-icons/react';

const DEMO_PROPOSAL_TOKEN = 'travelpropose-demo-2026';

export function CtaCards() {
  const { login, dashboard, proposal } = ptPT.landing.cta;

  return (
    <ul className="grid gap-6 sm:grid-cols-3 max-w-5xl mx-auto" aria-label="Ações principais">
      <li>
        <Card className="p-6 flex flex-col justify-between h-full bg-white border-border hover:border-royal-blue/30 transition-all">
          <div>
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-royal-blue/10 text-royal-blue">
              <SignIn size={20} weight="regular" />
            </div>
            <h2 className="text-lg font-semibold text-royal-blue mb-2">{login.title}</h2>
            <p className="text-sm text-slate-gray mb-6 leading-relaxed">{login.description}</p>
          </div>
          <Button asChild className="w-full bg-royal-blue hover:bg-royal-blue/90 text-white">
            <Link href={login.href}>{login.label}</Link>
          </Button>
        </Card>
      </li>
      <li>
        <Card className="p-6 flex flex-col justify-between h-full bg-white border-border hover:border-royal-blue/30 transition-all">
          <div>
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Kanban size={20} weight="regular" />
            </div>
            <h2 className="text-lg font-semibold text-royal-blue mb-2">{dashboard.title}</h2>
            <p className="text-sm text-slate-gray mb-6 leading-relaxed">{dashboard.description}</p>
          </div>
          <Button asChild variant="outline" className="w-full border-border text-foreground hover:bg-muted/50">
            <Link href={dashboard.href}>{dashboard.label}</Link>
          </Button>
        </Card>
      </li>
      <li>
        <Card className="p-6 flex flex-col justify-between h-full bg-white border-border hover:border-royal-blue/30 transition-all">
          <div>
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-aqua-green">
              <Eye size={20} weight="regular" />
            </div>
            <h2 className="text-lg font-semibold text-royal-blue mb-2">{proposal.title}</h2>
            <p className="text-sm text-slate-gray mb-6 leading-relaxed">{proposal.description}</p>
          </div>
          <Button asChild className="w-full bg-aqua-green hover:bg-aqua-green/90 text-white">
            <Link href={`/p/${DEMO_PROPOSAL_TOKEN}`}>{proposal.label}</Link>
          </Button>
        </Card>
      </li>
    </ul>
  );
}
