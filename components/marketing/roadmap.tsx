'use client';

import { ptPT } from '@/lib/i18n/pt-PT';
import { Card } from '@/components/ui/card';
import { Signpost } from '@phosphor-icons/react';

export function Roadmap() {
  return (
    <section aria-labelledby="roadmap-title" className="max-w-5xl mx-auto py-8">
      <Card className="p-8 bg-slate-50/50 border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-royal-blue/10 text-royal-blue">
            <Signpost size={20} weight="regular" />
          </div>
          <h2 id="roadmap-title" className="text-xl font-semibold text-royal-blue">
            {ptPT.landing.roadmap.title}
          </h2>
        </div>
        <p className="text-sm text-slate-gray mb-6 max-w-2xl leading-relaxed">
          {ptPT.landing.roadmap.description}
        </p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ptPT.landing.roadmap.items.map((item) => (
            <li key={item.title}>
              <Card className="p-4 bg-white border-border h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-royal-blue mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-gray leading-relaxed">{item.description}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
