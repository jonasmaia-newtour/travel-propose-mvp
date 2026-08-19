import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from '@/app/(auth)/login/login-form';

export default async function LoginPage() {
  await connection();

  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (user) {
    redirect('/');
  }

  return <LoginForm />;
}
