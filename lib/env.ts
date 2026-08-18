/**
 * Validação de variáveis de ambiente no arranque da aplicação.
 * Falha rapidamente (fail-fast) se alguma variável obrigatória estiver ausente ou inválida.
 * Nunca expor valores deste módulo em logs — contém segredos de servidor.
 */
import { z } from 'zod';

// Schema das variáveis de ambiente públicas (browser-safe)
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida'),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY é obrigatória'),
});

// Schema das variáveis de ambiente exclusivas do servidor
const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SECRET_KEY: z
    .string()
    .min(1, 'SUPABASE_SECRET_KEY é obrigatória'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

// Tipo inferido da configuração pública
export type PublicEnv = z.infer<typeof publicEnvSchema>;

// Tipo inferido da configuração completa do servidor
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Formata os erros Zod numa mensagem legível sem expor valores (proteção de PII).
 */
function formatZodErrors(errors: z.ZodIssue[]): string {
  return errors.map((e) => `  • ${e.path.join('.')}: ${e.message}`).join('\n');
}

/**
 * Valida e devolve as variáveis de ambiente públicas.
 * Seguro para usar em componentes de cliente.
 */
export function getPublicEnv(): PublicEnv {
  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    throw new Error(
      `Variáveis de ambiente públicas inválidas:\n${formatZodErrors(result.error.issues)}`
    );
  }

  return result.data;
}

/**
 * Valida e devolve todas as variáveis de ambiente do servidor.
 * Chamar apenas em Server Components, Server Actions ou Route Handlers.
 * Nunca exportar o resultado desta função para o cliente.
 */
export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!result.success) {
    // Mensagem de erro sem expor valores — apenas nomes e descrições das variáveis inválidas
    throw new Error(
      `Variáveis de ambiente do servidor inválidas:\n${formatZodErrors(result.error.issues)}`
    );
  }

  return result.data;
}
