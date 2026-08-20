import { expect, test } from '@playwright/test';

/**
 * E2E de criação e publicação (US1).
 * O Agent cria um rascunho, adiciona secção e itens, guarda e publica;
 * a proposta publicada aparece no kanban em "Enviada" e o link público é mostrado.
 * A sessão é fornecida pelo storageState do projeto (auth.setup.ts).
 * Requer as env vars NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * e os utilizadores demo do seed (newtour-test).
 */

function futureLocalInput(daysFromNow: number): string {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

test('agent cria, guarda e publica uma proposta com secção e itens', async ({ page }) => {
  const titulo = `Viagem demo ${Date.now()}`;

  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('As minhas propostas', {
    timeout: 30000,
  });

  await page.getByRole('link', { name: 'Nova proposta' }).click();
  await expect(page).toHaveURL(/\/proposals\/new$/);
  await page.getByRole('button', { name: 'Começar rascunho' }).click();
  await expect(page).toHaveURL(/\/proposals\/[0-9a-f-]{36}\/edit$/);

  await page.getByLabel('Título da proposta').fill(titulo);
  await page.getByLabel('Valor base (€)').fill('1000.00');
  await page.getByLabel('Validade').fill(futureLocalInput(2));
  await page.getByLabel('Observações').fill('Proposta de demonstração do criador.');

  await page.getByRole('button', { name: 'Adicionar secção' }).click();
  await page.getByLabel('Título da secção').fill('Alojamento');
  await page.getByRole('button', { name: 'Adicionar item' }).click();
  await page.getByLabel('Título', { exact: true }).fill('Hotel Central');
  await page.getByLabel('Variação de preço (€)').fill('150.00');

  await page.getByRole('button', { name: 'Guardar rascunho' }).click();
  await expect(page.getByRole('button', { name: 'Guardar rascunho' })).toBeEnabled({
    timeout: 30000,
  });

  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByText('Proposta publicada!')).toBeVisible({ timeout: 30000 });
  const linkPublico = page.locator('a[href^="/p/"]');
  await expect(linkPublico).toBeVisible();
  await expect(linkPublico).toHaveAttribute('href', /^\/p\/[A-Za-z0-9_-]{40,}$/);

  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('As minhas propostas', {
    timeout: 30000,
  });
  const colunaEnviadas = page.getByRole('region', { name: 'Enviada' });
  await expect(colunaEnviadas.getByText(titulo)).toBeVisible();
});
