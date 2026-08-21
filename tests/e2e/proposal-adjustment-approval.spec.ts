import { expect, test } from '@playwright/test';

/**
 * E2E de ajuste e aceite (US2/US3 — T047).
 * Cobre o quickstart 3–4: Agent cria/publica → viajante pede ajuste
 * (proposta volta a rascunho) → Agent republica → viajante aprova
 * e vê recibo imutável; segunda aprovação é bloqueada.
 * A sessão do Agent vem do storageState (auth.setup.ts).
 */

function futureLocalInput(daysFromNow: number): string {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

async function criarEFluxoPublicavel(
  page: import('@playwright/test').Page,
  titulo: string
): Promise<{ token: string; editUrl: string; titulo: string }> {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('As minhas propostas', {
    timeout: 30000,
  });

  await page.getByRole('link', { name: 'Nova proposta' }).click();
  await expect(page).toHaveURL(/\/proposals\/new$/);
  await page.getByRole('button', { name: 'Começar rascunho' }).click();
  await expect(page).toHaveURL(/\/proposals\/[0-9a-f-]{36}\/edit$/);
  const editUrl = page.url();

  await page.getByLabel('Título da proposta').fill(titulo);
  await page.getByLabel('Valor base (€)').fill('1200.00');
  await page.getByLabel('Validade').fill(futureLocalInput(2));
  await page.getByLabel('Observações').fill('Condições de demonstração para ajuste e aceite.');

  await page.getByRole('button', { name: 'Adicionar secção' }).click();
  await page.getByLabel('Título da secção').last().fill('Alojamento');
  const primeiraSeccao = page.locator('fieldset').first();
  await primeiraSeccao.getByRole('button', { name: 'Adicionar item' }).click();
  await primeiraSeccao.getByLabel('Título', { exact: true }).last().fill('Hotel A');
  await primeiraSeccao.getByLabel('Variação de preço (€)').last().fill('0.00');
  await primeiraSeccao.getByRole('button', { name: 'Adicionar item' }).click();
  await primeiraSeccao.getByLabel('Título', { exact: true }).last().fill('Hotel B');
  await primeiraSeccao.getByLabel('Variação de preço (€)').last().fill('180.00');

  await page.getByRole('button', { name: 'Adicionar secção' }).click();
  await page.getByLabel('Título da secção').last().fill('Extras');
  await page.getByLabel('Tipo de escolha').last().selectOption('multiple');
  const segundaSeccao = page.locator('fieldset').last();
  await segundaSeccao.getByRole('button', { name: 'Adicionar item' }).click();
  await segundaSeccao.getByLabel('Título', { exact: true }).last().fill('Voo');
  await segundaSeccao.getByLabel('Variação de preço (€)').last().fill('220.00');
  await segundaSeccao.getByRole('button', { name: 'Adicionar item' }).click();
  await segundaSeccao.getByLabel('Título', { exact: true }).last().fill('Transfer');
  await segundaSeccao.getByLabel('Variação de preço (€)').last().fill('40.00');

  await page.getByRole('button', { name: 'Guardar rascunho' }).click();
  await expect(page.getByRole('button', { name: 'Guardar rascunho' })).toBeEnabled({
    timeout: 30000,
  });

  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByText('Proposta publicada!')).toBeVisible({ timeout: 30000 });
  const linkPublico = page.locator('a[href^="/p/"]');
  await expect(linkPublico).toHaveAttribute('href', /^\/p\/[A-Za-z0-9_-]{40,}$/);
  const token = (await linkPublico.getAttribute('href'))!.replace('/p/', '');

  return { token, editUrl, titulo };
}

test('viajante pede ajuste e proposta volta para revisao, agent republica', async ({
  page,
}) => {
  const titulo = `Viagem ajuste ${Date.now()}`;
  const { token, editUrl } = await criarEFluxoPublicavel(page, titulo);

  await page.goto(`/p/${token}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(titulo, { timeout: 30000 });
  await expect(page.getByTestId('simulator-total')).toBeVisible();

  await expect(page.getByText('A proposta expirou')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Pedir ajuste' })).toBeVisible();
  await page.getByRole('button', { name: 'Pedir ajuste' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pedir ajuste' })).toBeVisible();

  const observacao = `Preciso alterar datas para ${Date.now()}`;
  await page.getByLabel('Observação').fill(observacao);
  await expect(page.getByText(`${observacao.length}/2000`)).toBeVisible();
  await page.getByRole('button', { name: 'Enviar pedido' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 30000 });

  await page.goto(`/p/${token}`);
  await expect(page.getByText('404')).toBeVisible({ timeout: 10000 });

  const viaApi = await page.request.get(`/api/v1/public/proposals/${token}`);
  expect(viaApi.status()).toBe(404);

  await page.goto(editUrl);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Editar proposta', {
    timeout: 30000,
  });
  await expect(page.getByLabel('Título da proposta')).toHaveValue(titulo);
  await page.getByLabel('Título da proposta').fill(`${titulo} (revista)`);

  await page.getByRole('button', { name: 'Guardar rascunho' }).click();
  await expect(page.getByRole('button', { name: 'Guardar rascunho' })).toBeEnabled({
    timeout: 30000,
  });
  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByText('Proposta publicada!')).toBeVisible({ timeout: 30000 });
  const novoLink = page.locator('a[href^="/p/"]');
  await expect(novoLink).toHaveAttribute('href', /^\/p\/[A-Za-z0-9_-]{40,}$/);
  const novoToken = (await novoLink.getAttribute('href'))!.replace('/p/', '');
  expect(novoToken).not.toBe(token);

  await page.goto(`/p/${novoToken}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${titulo} (revista)`, {
    timeout: 30000,
  });
  await expect(page.getByTestId('simulator-total')).toBeVisible();
});

test('viajante aprova proposta, ve recibo e segunda aprovacao e bloqueada', async ({ page }) => {
  const titulo = `Viagem aceite ${Date.now()}`;
  const { token } = await criarEFluxoPublicavel(page, titulo);

  await page.goto(`/p/${token}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(titulo, { timeout: 30000 });

  const total = page.getByTestId('simulator-total');
  await expect(total).toBeVisible();
  await expect(page.getByLabel('Hotel A')).toBeChecked();
  await expect(page.getByLabel('Voo')).not.toBeChecked();

  await page.getByLabel('Hotel B').check();
  await page.getByLabel('Voo').check();
  await expect(total).toHaveText(/1\s*400,00\s*€/);

  const botaoAprovar = page.getByRole('button', { name: 'Aprovar proposta' });
  await expect(botaoAprovar).toBeDisabled();
  await page.getByLabel('Aceito as condições apresentadas na proposta.').check();
  await expect(botaoAprovar).toBeEnabled();

  const totalTexto = await total.textContent();
  await botaoAprovar.click();
  const reciboDialog = page.getByRole('dialog');
  await expect(reciboDialog).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole('heading', { name: 'Proposta aprovada' })).toBeVisible();
  await expect(page.getByText(/Aceite registado/)).toBeVisible();

  const receiptTotal = page.getByTestId('receipt-total');
  await expect(receiptTotal).toBeVisible();
  await expect(receiptTotal).toHaveText(totalTexto ?? '');

  await expect(page.getByText('Versão das condições')).toBeVisible();
  await reciboDialog.getByRole('button', { name: 'Fechar' }).click();
  await expect(reciboDialog).not.toBeVisible();

  await botaoAprovar.click();
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('alert')).toContainText(/Não foi possível aprovar/);

  await page.goto(`/p/${token}`);
  await expect(page.getByText('404')).toBeVisible({ timeout: 10000 });

  const viaApiAprovada = await page.request.get(`/api/v1/public/proposals/${token}`);
  expect(viaApiAprovada.status()).toBe(404);
});

test('viajante ve aviso de expiracao quando o prazo termina durante a navegacao', async ({
  page,
}) => {
  const titulo = `Viagem validade ${Date.now()}`;
  const { token } = await criarEFluxoPublicavel(page, titulo);

  await page.goto(`/p/${token}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(titulo, { timeout: 30000 });
  await expect(page.getByText('A proposta expirou')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Aprovar proposta' })).toBeVisible();

  await page.goto('/p/token-inexistente-xyz-1234567890abcdef1234567890');
  await expect(page.getByText('404')).toBeVisible({ timeout: 10000 });
});
