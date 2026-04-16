// env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET muss mindestens 32 Zeichen lang sein.'),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET muss mindestens 32 Zeichen lang sein.'),
});

export type Env = z.infer<typeof envSchema>;

const parseResult = envSchema.safeParse(process.env);
if (!parseResult.success) {
  console.error('[ENV] Konfigurationsfehler:', parseResult.error.format());
  process.exit(1);
}
export const env: Env = parseResult.data;
