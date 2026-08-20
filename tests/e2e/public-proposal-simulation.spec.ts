import { expect, test } from '@playwright/test';

/**
 * E2E de simulação pública (US2).
 * O Agent cria e publica uma proposta com secções de escolha única e múltipla;
 * o viajante abre o link público, muda as opções e vê o total atualizar.
 * A sessão do Agent é fornecida pelo storageState do projeto (auth.setup.ts).
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

test('viajante simula opções e vê o total estimado atualizar', async ({ page }) => {
  const titulo = `Viagem simulação ${Date.now()}`;

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

  await page.getByRole('button', { name: 'Adicionar secção' }).click();
  await page.getByLabel('Título da secção').fill('Alojamento');
  await page.getByRole('button', { name: 'Adicionar item' }).click();
  await page.getByLabel('Título', { exact: true }).fill('Hotel A');
  await page.getByLabel('Variação de preço (€)').fill('0.00');
  await page.getByRole('button', { name: 'Adicionar item' }).click();
  await page.getByLabel('Título', { exact: true }).fill('Hotel B');
  await page.getByLabel('Variação de preço (€)').fill('150.00');

  await page.getByRole('button', { name: 'Adicionar secção' }).click();
  await page.getByLabel('Título da secção').fill('Extras');
  await page.getByRole('button', { name: 'Adicionar item' }).click();
  await page.getByLabel('Título', { exact: true }).fill('Voo');
  await page.getByLabel('Variação de preço (€)').fill('200.00');
  await page.getByRole('button', { name: 'Adicionar item' }).click();
  await page.getByLabel('Título', { exact: true }).fill('Transfer');
  await page.getByLabel('Variação de preço (€)').fill('50.00');

  await page.getByRole('button', { name: 'Guardar rascunho' }).click();
  await expect(page.getByRole('button', { name: 'Guardar rascunho' })).toBeEnabled({
    timeout: 30000,
  });
  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByText('Proposta publicada!')).toBeVisible({ timeout: 30000 });

  const linkPublico = page.locator('a[href^="/p/"]');
  await expect(linkPublico).toHaveAttribute('href', /^\/p\/[A-Za-z0-9_-]{40,}$/);
  const token = (await linkPublico.getAttribute('href'))!.replace('/p/', '');

  await page.goto(`/p/${token}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(titulo, { timeout: 30000 });

  const total = page.getByTestId('simulator-total');

  await expect(page.getByLabel('Hotel A')).toBeChecked();
  await expect(page.getByLabel('Voo')).not.toBeChecked();
  await expect(total).toHaveText(/1\s*000,00\s*€/);

  await page.getByLabel('Hotel B').check();
  await expect(total).toHaveText(/1\s*150,00\s*€/);

  await page.getByLabel('Voo').check();
  await page.getByLabel('Transfer').check();
  await expect(total).toHaveText(/1\s*400,00\s*€/);

  await page.getByLabel('Transfer').uncheck();
  await expect(total).toHaveText(/1\s*350,00\s*€/);

  await expect(page.getByLabel('Hotel A')).not.toBeChecked();
});