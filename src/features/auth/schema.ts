import { z } from 'zod';

/**
 * Zod schemas for the auth forms. Messages are i18n keys; the form components
 * translate them with `t(...)` before display.
 */
export const loginSchema = z.object({
  email: z.string().min(1, 'validation.required').email('validation.email'),
  password: z.string().min(1, 'validation.required'),
});

export const registerSchema = z
  .object({
    displayName: z.string().min(2, 'validation.nameMin'),
    email: z.string().min(1, 'validation.required').email('validation.email'),
    password: z.string().min(6, 'validation.passwordMin'),
    confirmPassword: z.string().min(1, 'validation.required'),
    birthDate: z.string().optional(),
    gender: z.enum(['male', 'female', 'other', 'unspecified']).optional(),
    acceptPrivacy: z.literal(true, {
      errorMap: () => ({ message: 'validation.acceptPrivacy' }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'validation.passwordMismatch',
  });

export const artistRegisterSchema = z.object({
  artistName: z.string().min(2, 'validation.nameMin'),
  email: z.string().min(1, 'validation.required').email('validation.email'),
  password: z.string().min(6, 'validation.passwordMin'),
  portfolioUrl: z.string().url('validation.url').optional().or(z.literal('')),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ArtistRegisterValues = z.infer<typeof artistRegisterSchema>;

/** Flatten a ZodError into a `{ field: messageKey }` map. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !out[key]) out[key] = issue.message;
  }
  return out;
}
