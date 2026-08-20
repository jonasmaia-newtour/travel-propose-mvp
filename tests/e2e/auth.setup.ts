import { test as setup, expect, type Page } from '@playwright/test';

/**
 * Setup de sessões E2E (reduz chamadas de auth no CI):
 * inicia sessão uma única vez por papel demo e guarda o estado do browser,
 * reutilizado pelos projetos com storageState. Sem este setup, cada teste e
 * viewport fazia login (15 sign-ins por run contra o limite por IP do Supabase).
 */

const senhaDemo = 'TravelPropose2026!';
const authDir = 'playwright/.auth';

const contas = [
  { papel: 'OWNER', email: 'owner@newtour-test.com', ficheiro: `${authDir}/owner.json` },
  { papel: 'ADMIN', email: 'manager@newtour-test.com', ficheiro: `${authDir}/manager.json` },
  { papel: 'MEMBER', email: 'agent@newtour-test.com', ficheiro: `${authDir}/agent.json` },
] as const;

async function iniciarSessao(page: Page, email: string, senha: string): Promise<void> {
  await page.goto('/login');
  for (let tentativa = 1; tentativa <= 3; tentativa += 1) {
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Palavra-passe').fill(senha);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL(/\/dashboard$|\/login$/, { timeout: 30_000 });
    if (new URL(page.url()).pathname === '/dashboard') return;
    // O login devolve a mesma mensagem para qualquer erro do signInWithPassword,
    // incluindo 429 do Supabase Auth (limite por IP partilhado); logo, não é
    // possível distinguir falha de credenciais de um 429 transitório. Tentar de
    // novo com backoff; credenciais inválidas falham consistentemente nas 3.
    await page.waitForTimeout(2_000);
  }
  throw new Error(`Sessão não iniciada após 3 tentativas (${email}).`);
}

setup.describe.configure({ mode: 'serial' });

for (const conta of contas) {
  setup(`iniciar sessão para ${conta.papel}`, async ({ page }) => {
    await iniciarSessao(page, conta.email, senhaDemo);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.context().storageState({ path: conta.ficheiro });
  });
}