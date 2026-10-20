/**
 * lib/sanitize.ts
 *
 * Server-side input sanitization helpers.
 * React already HTML-escapes values it renders, so these are extra
 * defences for data stored in the DB and returned in API responses.
 */

/**
 * Strip any HTML tags from a string.
 * Prevents stored-XSS if content is ever rendered via dangerouslySetInnerHTML
 * or a raw HTML context.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

/**
 * Sanitize a plain text field: strip HTML, collapse whitespace, enforce max length.
 */
export function sanitizeText(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") return "";
  return stripHtml(input).slice(0, maxLength);
}

/**
 * Sanitize an email address: lowercase, trim, basic format check.
 * Returns empty string if invalid.
 */
export function sanitizeEmail(input: unknown): string {
  if (typeof input !== "string") return "";
  const trimmed = input.trim().toLowerCase();
  // Basic RFC-5321 check — rejects the most obvious non-emails
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return EMAIL_RE.test(trimmed) ? trimmed : "";
}

/**
 * Sanitize a phone number: keep only digits, spaces, +, -, (, )
 */
export function sanitizePhone(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.replace(/[^0-9 +\-().]/g, "").slice(0, 30);
}

/**
 * Sanitize a UUID string: only allow lowercase hex + hyphens.
 * Returns null if it doesn't look like a UUID.
 */
export function sanitizeUuid(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return UUID_RE.test(input.trim()) ? input.trim().toLowerCase() : null;
}

/**
 * Sanitize a long text/PRD content field.
 * Strips HTML tags, enforces a generous max length for PRD content.
 */
export function sanitizePrdContent(input: unknown): string {
  return sanitizeText(input, 20_000);
}

/**
 * Validate that a value is one of the allowed enum members.
 */
export function sanitizeEnum<T extends string>(
  input: unknown,
  allowed: readonly T[]
): T | null {
  if (typeof input !== "string") return null;
  return (allowed as unknown as string[]).includes(input) ? (input as T) : null;
}
