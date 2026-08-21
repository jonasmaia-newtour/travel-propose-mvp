import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * E2E da landing (US5 — T055):
 * visitante navega pelos CTAs e proposta exemplo; acessibilidade sem violações.
 * Roda em anonymous (sem storageState).
 */

test('landing mostra hero, CTAs e roadmap sem violacoes de acessibilidade', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Propostas de viagem interativas, com aceite auditável'
  );
  await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Entrar na plataforma' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Painel da agência (demo)' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Proposta de exemplo' })).toBeVisible();

  await expect(page.getByRole('heading', { name: /Roadmap/ })).toBeVisible();
  await expect(page.getByText('Convites e gestão de membros')).toBeVisible();
  await expect(page.getByText('Faturação e subscrições')).toBeVisible();
  await expect(page.getByText('Integrações externas')).toBeVisible();
  await expect(page.getByText('Relatórios avançados')).toBeVisible();
  await expect(page.getByText('Notificações em tempo real')).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('visitante navega da landing para login, dashboard e proposta exemplo', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Entrar' }).first().click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto('/');
  await page.getByRole('link', { name: 'Abrir painel' }).click();
  await expect(page).toHaveURL(/\/dashboard$|\/login$/);

  await page.goto('/');
  await page.getByRole('link', { name: 'Abrir proposta' }).click();
  await expect(page).toHaveURL(/\/p\/travelpropose-demo-2026$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Viagem de exemplo Acores', {
    timeout: 30000,
  });
  await expect(page.getByTestId('simulator-total')).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
