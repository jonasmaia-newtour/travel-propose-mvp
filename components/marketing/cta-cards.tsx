'use client';

import Link from 'next/link';
import { ptPT } from '@/lib/i18n/pt-PT';
import { Card } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
          <Link
            href={login.href}
            className={cn(buttonVariants({ variant: 'default' }), 'w-full justify-center')}
          >
            {login.label}
          </Link>
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
          <Link
            href={dashboard.href}
            className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center')}
          >
            {dashboard.label}
          </Link>
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
          {/* Cor #00845a garante ratio 4.6:1 com branco (WCAG AA) — aqua-green (#00a86b) ficava em 3.08:1 */}
          <Link
            href={`/p/${DEMO_PROPOSAL_TOKEN}`}
            className={cn(buttonVariants({ variant: 'default' }), 'w-full justify-center bg-[#00845a] hover:bg-[#006e4b]')}
          >
            {proposal.label}
          </Link>
        </Card>
      </li>
    </ul>
  );
}
