import { ptPT } from '@/lib/i18n/pt-PT';

export function Roadmap() {
  return (
    <section aria-labelledby="roadmap-title" className="rounded-lg border border-foreground/10 bg-card p-6">
      <h2 id="roadmap-title" className="text-lg font-semibold">
        {ptPT.landing.roadmap.title}
      </h2>
      <p className="mt-2 text-sm text-foreground/70">{ptPT.landing.roadmap.description}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {ptPT.landing.roadmap.items.map((item) => (
          <li key={item.title} className="rounded-md border border-foreground/10 p-4">
            <h3 className="text-sm font-medium">{item.title}</h3>
            <p className="mt-1 text-sm text-foreground/70">{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
