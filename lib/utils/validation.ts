import { z } from 'zod';

/**
 * Sanitization utilities
 */

// Remove potentially dangerous HTML/script content
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Sanitize string for database storage
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input) return '';

  return input
    .trim()
    .slice(0, maxLength)
    // Remove null bytes
    .replace(/\0/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ');
}

// Sanitize email
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().slice(0, 254);
}

/**
 * Validation schemas using Zod
 */

// Email validation
export const emailSchema = z
  .string()
  .min(1, 'Email requis')
  .max(254, 'Email trop long')
  .email('Email invalide')
  .transform(sanitizeEmail);

// Phone number validation (international format)
export const phoneSchema = z
  .string()
  .min(1, 'Numéro de téléphone requis')
  .max(20, 'Numéro trop long')
  .regex(/^\+?[1-9]\d{6,14}$/, 'Format de numéro invalide (ex: +33612345678)')
  .transform((val) => val.replace(/\s/g, ''));

// Sanitize phone number
export function sanitizePhone(phone: string): string {
  return phone.replace(/\s/g, '').replace(/[^+\d]/g, '').slice(0, 20);
}

// Feedback/comment validation (Web workflow - with email)
export const feedbackSchema = z.object({
  merchant_id: z.string().uuid('ID marchand invalide'),
  rating: z.number().int().min(1, 'Note minimum 1').max(5, 'Note maximum 5'),
  comment: z
    .string()
    .max(2000, 'Commentaire trop long (max 2000 caractères)')
    .optional()
    .transform((val) => (val ? sanitizeString(val, 2000) : undefined)),
  customer_email: emailSchema,
  user_token: z.string().uuid().optional(),
});

// Feedback validation for WhatsApp workflow (with phone instead of email)
export const feedbackSchemaWhatsApp = z.object({
  merchant_id: z.string().uuid('ID marchand invalide'),
  rating: z.number().int().min(1, 'Note minimum 1').max(5, 'Note maximum 5'),
  comment: z
    .string()
    .max(2000, 'Commentaire trop long (max 2000 caractères)')
    .optional()
    .transform((val) => (val ? sanitizeString(val, 2000) : undefined)),
  customer_phone: phoneSchema,
  user_token: z.string().uuid().optional(),
});

// Prize validation
export const prizeSchema = z.object({
  merchant_id: z.string().uuid('ID marchand invalide'),
  name: z
    .string()
    .min(1, 'Nom requis')
    .max(100, 'Nom trop long')
    .transform((val) => sanitizeString(val, 100)),
  description: z
    .string()
    .max(500, 'Description trop longue')
    .optional()
    .transform((val) => (val ? sanitizeString(val, 500) : undefined)),
  probability: z
    .number()
    .min(0, 'Probabilité minimum 0')
    .max(100, 'Probabilité maximum 100'),
  quantity: z.number().int().min(0, 'Quantité minimum 0').optional(),
  image_url: z.string().url('URL image invalide').optional().nullable(),
});

// Merchant profile validation
export const merchantProfileSchema = z.object({
  business_name: z
    .string()
    .min(1, 'Nom commercial requis')
    .max(100, 'Nom trop long')
    .transform((val) => sanitizeString(val, 100)),
  google_review_link: z.string().url('URL invalide').optional().nullable(),
  google_maps_url: z.string().url('URL invalide').optional().nullable(),
  tripadvisor_url: z.string().url('URL invalide').optional().nullable(),
  instagram_url: z.string().url('URL invalide').optional().nullable(),
  tiktok_url: z.string().url('URL invalide').optional().nullable(),
  unlucky_probability: z
    .number()
    .min(0, 'Probabilité minimum 0')
    .max(100, 'Probabilité maximum 100')
    .optional(),
  retry_probability: z
    .number()
    .min(0, 'Probabilité minimum 0')
    .max(100, 'Probabilité maximum 100')
    .optional(),
});

// Spin request validation
export const spinRequestSchema = z.object({
  merchant_id: z.string().uuid('ID marchand invalide'),
  user_token: z.string().uuid('Token utilisateur invalide').optional(),
});

// URL validation helper
export const urlSchema = z
  .string()
  .url('URL invalide')
  .max(2048, 'URL trop longue')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: 'URL doit commencer par http:// ou https://' }
  );

/**
 * Validation helpers
 */

// Validate and parse data with a schema
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Use flatten() for Zod v4 compatibility
  const flattened = result.error.flatten();
  const fieldErrors = Object.entries(flattened.fieldErrors)
    .flatMap(([field, messages]) =>
      (messages as string[]).map((msg) => `${field}: ${msg}`)
    );
  const formErrors = flattened.formErrors;
  const errors = [...formErrors, ...fieldErrors];

  return { success: false, errors };
}

// Quick email validation
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

// Quick phone validation
export function isValidPhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success;
}

// Quick UUID validation
export function isValidUUID(id: string): boolean {
  return z.string().uuid().safeParse(id).success;
}

// Validate probabilities sum (for prizes)
export function validateProbabilitiesSum(
  prizes: { probability: number }[],
  unluckyProb: number = 0,
  retryProb: number = 0
): { valid: boolean; total: number; message?: string } {
  const prizeProb = prizes.reduce((sum, p) => sum + p.probability, 0);
  const total = prizeProb + unluckyProb + retryProb;

  if (total !== 100) {
    return {
      valid: false,
      total,
      message: `La somme des probabilités doit être égale à 100% (actuellement: ${total}%)`,
    };
  }

  return { valid: true, total };
}

/**
 * Rate limiting helper (simple in-memory implementation)
 * For production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);
