import Link from 'next/link';

const DEMO_PROPOSAL_TOKEN = 'teste-local-token-xyz';

export default function Home() {
  return (
    <main className="flex min-h-full flex-col">
      <header className="border-b border-foreground/10 bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-lg font-semibold text-foreground">TravelPropose</span>
          <Link
            href="/login"
            className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground"
          >
            Entrar
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:py-24">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Propostas de viagem interativas, com aceite auditável
        </h1>
        <p className="mt-4 max-w-2xl text-foreground/70">
          O TravelPropose substitui propostas estáticas e conversas dispersas por links
          seguros: o viajante simula opções, pede ajustes e aprova a combinação — tudo
          registado numa única fonte de verdade.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          <li className="rounded-lg border border-foreground/10 bg-secondary/50 p-6">
            <h2 className="text-base font-semibold">Entrar na plataforma</h2>
            <p className="mt-2 text-sm text-foreground/70">
              Acesso da agência: pipeline, propostas e equipa.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Entrar
            </Link>
          </li>
          <li className="rounded-lg border border-foreground/10 bg-secondary/50 p-6">
            <h2 className="text-base font-semibold">Painel da agência (demo)</h2>
            <p className="mt-2 text-sm text-foreground/70">
              Demonstração com Owner, Manager e Agent (newtour-test).
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block rounded-md border border-foreground/20 px-4 py-2 text-sm font-medium text-foreground"
            >
              Abrir painel
            </Link>
          </li>
          <li className="rounded-lg border border-foreground/10 bg-secondary/50 p-6">
            <h2 className="text-base font-semibold">Proposta de exemplo</h2>
            <p className="mt-2 text-sm text-foreground/70">
              Simule opções e veja o total atualizar como um viajante.
            </p>
            <Link
              href={`/p/${DEMO_PROPOSAL_TOKEN}`}
              className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
            >
              Abrir proposta
            </Link>
          </li>
        </ul>
      </section>

      <footer className="border-t border-foreground/10 py-6">
        <div className="mx-auto w-full max-w-6xl px-4 text-sm text-foreground/70">
          TravelPropose — MVP em desenvolvimento.
        </div>
      </footer>
    </main>
  );
}
