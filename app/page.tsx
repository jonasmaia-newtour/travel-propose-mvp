import Link from 'next/link';
import { CtaCards } from '@/components/marketing/cta-cards';
import { Hero } from '@/components/marketing/hero';
import { Roadmap } from '@/components/marketing/roadmap';
import { ptPT } from '@/lib/i18n/pt-PT';

export default function Home() {
  return (
    <main className="flex min-h-full flex-col">
      <header className="border-b border-foreground/10 bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-lg font-semibold text-foreground">{ptPT.common.brand}</span>
          <Link
            href="/login"
            className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground"
          >
            {ptPT.common.entrar}
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:py-24">
        <Hero />
        <CtaCards />
        <div className="mt-12">
          <Roadmap />
        </div>
      </section>

      <footer className="border-t border-foreground/10 py-6">
        <div className="mx-auto w-full max-w-6xl px-4 text-sm text-foreground/70">
          {ptPT.landing.footer}
        </div>
      </footer>
    </main>
  );
}
