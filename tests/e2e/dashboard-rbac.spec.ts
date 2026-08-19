import { expect, test } from '@playwright/test';

/**
 * E2E de permissões do dashboard (US4).
 * Owner e Manager veem "Propostas da agência"; o Agent vê apenas as próprias.
 * Requer as env vars NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * e os utilizadores demo do seed (newtour-test).
 */

const senhaDemo = 'TravelPropose2026!';

const utilizadores = [
  { email: 'owner@newtour-test.com', papel: 'OWNER', titulo: 'Propostas da agência' },
  { email: 'manager@newtour-test.com', papel: 'ADMIN', titulo: 'Propostas da agência' },
  { email: 'agent@newtour-test.com', papel: 'MEMBER', titulo: 'As minhas propostas' },
] as const;

for (const utilizador of utilizadores) {
  test(`login e dashboard para ${utilizador.papel}`, async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(utilizador.email);
    await page.getByLabel('Palavra-passe').fill(senhaDemo);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(utilizador.titulo);
    await expect(page.getByText('Total de propostas')).toBeVisible();
    await expect(page.getByText(utilizador.email)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
  });
}

test('sem sessão, /dashboard redireciona para /login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});

test('sair encerra a sessão e volta ao login', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('agent@newtour-test.com');
  await page.getByLabel('Palavra-passe').fill(senhaDemo);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/login$/);
});