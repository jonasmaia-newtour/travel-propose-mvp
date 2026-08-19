'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '@/lib/auth/actions';

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, null);

  return (
    <form action={formAction} className="mx-auto mt-16 w-full max-w-sm space-y-6">
      <h1 className="text-center text-2xl font-semibold">Entrar na plataforma</h1>
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          Palavra-passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2"
        />
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? 'A entrar…' : 'Entrar'}
      </button>
    </form>
  );
}
