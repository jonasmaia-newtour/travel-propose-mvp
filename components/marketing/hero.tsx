'use client';

import { ptPT } from '@/lib/i18n/pt-PT';
import { Compass } from '@phosphor-icons/react';

export function Hero() {
  return (
    <div className="space-y-6 text-center max-w-3xl mx-auto py-12">
      <div className="inline-flex items-center gap-2 rounded-full bg-royal-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-royal-blue">
        <Compass size={16} weight="regular" />
        <span>{ptPT.landing.hero.tagline}</span>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-royal-blue">
        {ptPT.landing.hero.title}
      </h1>
      <p className="text-lg text-slate-gray leading-relaxed max-w-2xl mx-auto">
        {ptPT.landing.hero.subtitle}
      </p>
    </div>
  );
}
