import { ptPT } from '@/lib/i18n/pt-PT';

export function Hero() {
  return (
    <div className="space-y-4">
      <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
        {ptPT.landing.hero.title}
      </h1>
      <p className="max-w-2xl text-foreground/70">{ptPT.landing.hero.subtitle}</p>
    </div>
  );
}
