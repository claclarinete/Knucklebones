import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_URL: z.string().url(),
  /** Espera do bot antes de jogar, para a jogada dele ser visível. */
  BOT_DELAY_MS: z.coerce.number().int().min(0).default(800),
  /** Semente fixa do dado, para testes E2E. Ignorada em produção. */
  DICE_SEED: z.coerce.number().int().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Variáveis de ambiente inválidas:\n${problems}`);
  }
  return result.data;
}

/** A semente do dado só vale fora de produção, para ninguém prever os dados no site publicado. */
export function diceSeedOf(env: Env): number | undefined {
  return env.NODE_ENV === 'production' ? undefined : env.DICE_SEED;
}
