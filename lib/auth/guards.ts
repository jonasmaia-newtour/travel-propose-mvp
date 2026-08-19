import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/supabase/types';

export async function requireUser() {
  await connection();
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/login');
  return { client, user };
}

export async function requireRole(...roles: UserRole[]) {
  const { client, user } = await requireUser();
  const { data: profile } = await client
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();
  if (!profile) redirect('/login');
  if (!roles.includes(profile.role)) redirect('/');
  return { client, user, role: profile.role, organizationId: profile.organization_id };
}
