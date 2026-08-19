import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/supabase/types';

export async function requireUser() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/login');
  return { client, user };
}

export async function requireRole(...roles: UserRole[]) {
  const { client, user } = await requireUser();
  const { data: profile } = await client.from('profiles').select('role').eq('id', user.id).single();
  if (!profile) redirect('/login');
  if (!roles.includes(profile.role)) redirect('/');
  return { client, user, role: profile.role };
}
