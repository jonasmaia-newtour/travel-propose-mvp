import type { ReactNode } from 'react';
import { requireUser } from '@/lib/auth/guards';
import { logout } from '@/lib/auth/actions';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = await requireUser();

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-foreground/10 bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <a href="/dashboard" className="text-lg font-semibold text-foreground">
            TravelPropose
          </a>
          <nav aria-label="Navegação principal">
            <ul className="flex items-center gap-2">
              <li>
                <a
                  href="/dashboard"
                  className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-foreground/5"
                >
                  Dashboard
                </a>
              </li>
            </ul>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground/60">{user.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}