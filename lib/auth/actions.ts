'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const loginSchema = z.object({
  email: z.email('Introduza um e-mail válido.'),
  password: z.string().min(1, 'Introduza a palavra-passe.'),
});

export type LoginState = { error: string } | null;

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: 'Dados de acesso inválidos.' };
  const client = await createClient();
  const { error } = await client.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: 'E-mail ou palavra-passe incorretos.' };
  redirect('/dashboard');
}

export async function logout() {
  const client = await createClient();
  await client.auth.signOut();
  redirect('/login');
}
