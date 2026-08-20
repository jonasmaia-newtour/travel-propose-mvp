import { expect, test } from '@playwright/test';

/**
 * E2E de permissões do dashboard (US4).
 * Owner e Manager veem "Propostas da agência"; o Agent vê apenas as próprias.
 * Cada papel corre apenas no projeto com o storageState respetivo (auth.setup.ts)
 * para não duplicar logins em cada viewport.
 * Requer as env vars NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * e os utilizadores demo do seed (newtour-test).
 */

const contas = [
  { email: 'owner@newtour-test.com', projeto: 'desktop-owner', titulo: 'Propostas da agência' },
  { email: 'manager@newtour-test.com', projeto: 'desktop-manager', titulo: 'Propostas da agência' },
  { email: 'agent@newtour-test.com', projeto: 'desktop-agent', titulo: 'As minhas propostas' },
] as const;

for (const conta of contas) {
  test(`dashboard para ${conta.email}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== conta.projeto, 'Sessão do papel existe apenas no projeto respetivo.');
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(conta.titulo);
    await expect(page.getByText('Total de propostas')).toBeVisible();
    await expect(page.getByText(conta.email)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
  });
}

test('sem sessão, /dashboard redireciona para /login', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'anonymous', 'Apenas sem sessão.');
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});

test('sair encerra a sessão e volta ao login', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-agent', 'Apenas com sessão de agente.');
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/login$/);
});
