/**
 * Sessão anónima do viajante (T046): identificador local estável por
 * separador, usado nas ações públicas (ajuste e aceite). Nunca é persistido
 * em bruto — as RPCs gravam apenas o hash. Sem cookies de terceiros e sem
 * PII; o sessionStorage é o único armazenamento e tem fallback em memória.
 */
const SESSION_STORAGE_KEY = 'travelpropose.public.session';

let moduleSessionId: string | null = null;

function generateSessionId(): string {
  return `tp-${crypto.randomUUID()}`;
}

export function getPublicSessionId(): string {
  if (typeof window === 'undefined') {
    if (moduleSessionId === null) {
      moduleSessionId = generateSessionId();
    }
    return moduleSessionId;
  }

  let stored: string | null = null;
  try {
    stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    stored = null;
  }

  if (stored === null) {
    stored = generateSessionId();
    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, stored);
    } catch {
      // Armazenamento indisponível: o fallback em memória mantém a sessão.
    }
    moduleSessionId = stored;
  }

  return stored;
}