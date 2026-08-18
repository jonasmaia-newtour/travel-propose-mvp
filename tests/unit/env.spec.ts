/**
 * Testes de validação do módulo lib/env.ts
 * Verifica que a validação Zod falha rapidamente com erros claros
 * e que aceita configurações válidas sem exceções.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Guardar e restaurar process.env entre testes.
// Usar Record<string, string | undefined> para evitar conflitos com
// os tipos readonly do @types/node (NODE_ENV é readonly via ProcessEnv).
const originalEnv = process.env;
type MutableEnv = Record<string, string | undefined>;

describe('getPublicEnv', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('devolve configuração válida quando todas as variáveis públicas estão presentes', async () => {
    (process.env as MutableEnv)['NEXT_PUBLIC_SUPABASE_URL'] = 'https://abc.supabase.co';
    (process.env as MutableEnv)['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';

    const { getPublicEnv } = await import('../../lib/env');
    const env = getPublicEnv();

    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://abc.supabase.co');
    expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
    );
  });

  it('lança erro quando NEXT_PUBLIC_SUPABASE_URL está ausente', async () => {
    delete (process.env as MutableEnv)['NEXT_PUBLIC_SUPABASE_URL'];
    (process.env as MutableEnv)['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] = 'key';

    const { getPublicEnv } = await import('../../lib/env');

    expect(() => getPublicEnv()).toThrow('Variáveis de ambiente públicas inválidas');
  });

  it('lança erro quando NEXT_PUBLIC_SUPABASE_URL não é uma URL válida', async () => {
    (process.env as MutableEnv)['NEXT_PUBLIC_SUPABASE_URL'] = 'nao-e-uma-url';
    (process.env as MutableEnv)['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] = 'key';

    const { getPublicEnv } = await import('../../lib/env');

    expect(() => getPublicEnv()).toThrow('NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida');
  });

  it('lança erro quando NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY está ausente', async () => {
    (process.env as MutableEnv)['NEXT_PUBLIC_SUPABASE_URL'] = 'https://abc.supabase.co';
    delete (process.env as MutableEnv)['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];

    const { getPublicEnv } = await import('../../lib/env');

    expect(() => getPublicEnv()).toThrow('Variáveis de ambiente públicas inválidas');
  });
});

describe('getServerEnv', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('devolve configuração completa quando todas as variáveis de servidor estão presentes', async () => {
    (process.env as MutableEnv)['NEXT_PUBLIC_SUPABASE_URL'] = 'https://abc.supabase.co';
    (process.env as MutableEnv)['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] = 'pub-key';
    (process.env as MutableEnv)['SUPABASE_SECRET_KEY'] = 'secret-key';
    (process.env as MutableEnv)['NODE_ENV'] = 'test';

    const { getServerEnv } = await import('../../lib/env');
    const env = getServerEnv();

    expect(env.SUPABASE_SECRET_KEY).toBe('secret-key');
    expect(env.NODE_ENV).toBe('test');
  });

  it('lança erro quando SUPABASE_SECRET_KEY está ausente', async () => {
    (process.env as MutableEnv)['NEXT_PUBLIC_SUPABASE_URL'] = 'https://abc.supabase.co';
    (process.env as MutableEnv)['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] = 'pub-key';
    delete (process.env as MutableEnv)['SUPABASE_SECRET_KEY'];

    const { getServerEnv } = await import('../../lib/env');

    expect(() => getServerEnv()).toThrow('Variáveis de ambiente do servidor inválidas');
  });

  it('usa development como valor por defeito de NODE_ENV quando não definido', async () => {
    (process.env as MutableEnv)['NEXT_PUBLIC_SUPABASE_URL'] = 'https://abc.supabase.co';
    (process.env as MutableEnv)['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] = 'pub-key';
    (process.env as MutableEnv)['SUPABASE_SECRET_KEY'] = 'secret-key';
    delete (process.env as MutableEnv)['NODE_ENV'];

    const { getServerEnv } = await import('../../lib/env');
    const env = getServerEnv();

    expect(env.NODE_ENV).toBe('development');
  });

  it('lança erro com NODE_ENV inválido', async () => {
    (process.env as MutableEnv)['NEXT_PUBLIC_SUPABASE_URL'] = 'https://abc.supabase.co';
    (process.env as MutableEnv)['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] = 'pub-key';
    (process.env as MutableEnv)['SUPABASE_SECRET_KEY'] = 'secret-key';
    (process.env as MutableEnv)['NODE_ENV'] = 'staging';

    const { getServerEnv } = await import('../../lib/env');

    expect(() => getServerEnv()).toThrow('Variáveis de ambiente do servidor inválidas');
  });

  it('a mensagem de erro não expõe valores das variáveis (proteção de PII)', async () => {
    (process.env as MutableEnv)['NEXT_PUBLIC_SUPABASE_URL'] = 'https://abc.supabase.co';
    (process.env as MutableEnv)['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] = 'pub-key';
    (process.env as MutableEnv)['SUPABASE_SECRET_KEY'] = 'segredo-ultra-secreto';
    (process.env as MutableEnv)['NODE_ENV'] = 'invalid';

    const { getServerEnv } = await import('../../lib/env');

    let errorMessage = '';
    try {
      getServerEnv();
    } catch (e) {
      errorMessage = (e as Error).message;
    }

    expect(errorMessage).not.toContain('segredo-ultra-secreto');
  });
});
