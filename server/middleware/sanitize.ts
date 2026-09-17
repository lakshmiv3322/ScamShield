// server/middleware/sanitize.ts
// Input validation and sanitization middleware.

export interface ValidationError {
  field: string;
  message: string;
}

// Strip dangerous HTML tags and potential script injection
export function sanitizeString(input: unknown, maxLength = 10000): string {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')       // strip all remaining HTML tags
    .replace(/javascript:/gi, '')  // strip JS protocol
    .replace(/on\w+\s*=/gi, '')    // strip inline event handlers
    .trim();
}

// Validate email format
export function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return email.length <= 254 && emailRegex.test(email);
}

// Validate URL (allows http/https only)
export function isSafeUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Validate phone number (Indian-focused: allows 10-13 digit numbers with optional country code)
export function isValidPhone(phone: unknown): boolean {
  if (typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

// Validate string length
export function assertLength(value: string, min: number, max: number, fieldName: string): ValidationError | null {
  if (value.length < min) return { field: fieldName, message: `${fieldName} must be at least ${min} characters.` };
  if (value.length > max) return { field: fieldName, message: `${fieldName} cannot exceed ${max} characters.` };
  return null;
}

// Validate auth register body
export function validateRegisterBody(body: unknown): { errors: ValidationError[]; cleaned: any } {
  const errors: ValidationError[] = [];
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

  const name = sanitizeString(b.name, 100);
  const email = sanitizeString(b.email, 254);
  const password = typeof b.password === 'string' ? b.password : '';
  const phone = sanitizeString(b.phone || '', 20);
  const circleName = sanitizeString(b.circleName || '', 100);
  const relation = sanitizeString(b.relation || 'Admin', 50);

  const nameLenErr = assertLength(name, 2, 100, 'Name');
  if (nameLenErr) errors.push(nameLenErr);

  if (!isValidEmail(email)) errors.push({ field: 'email', message: 'A valid email address is required.' });

  if (password.length < 8) errors.push({ field: 'password', message: 'Password must be at least 8 characters.' });
  if (password.length > 128) errors.push({ field: 'password', message: 'Password cannot exceed 128 characters.' });

  if (phone && !isValidPhone(phone)) errors.push({ field: 'phone', message: 'Phone number format is invalid.' });

  const circleNameErr = assertLength(circleName, 2, 100, 'Circle name');
  if (circleNameErr) errors.push(circleNameErr);

  return {
    errors,
    cleaned: { name, email, password, phone: phone || null, circleName, relation },
  };
}

// Validate auth login body
export function validateLoginBody(body: unknown): { errors: ValidationError[]; cleaned: any } {
  const errors: ValidationError[] = [];
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

  const email = sanitizeString(b.email, 254);
  const password = typeof b.password === 'string' ? b.password.slice(0, 128) : '';

  if (!isValidEmail(email)) errors.push({ field: 'email', message: 'A valid email address is required.' });
  if (!password) errors.push({ field: 'password', message: 'Password is required.' });

  return { errors, cleaned: { email, password } };
}

// Validate message analysis body
export function validateAnalyzeBody(body: unknown): { errors: ValidationError[]; cleaned: any } {
  const errors: ValidationError[] = [];
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

  const text = sanitizeString(b.text || '', 5000);
  const linkUrl = typeof b.linkUrl === 'string' ? b.linkUrl.slice(0, 2048) : undefined;
  const senderContact = sanitizeString(b.senderContact || '', 100);

  // imageUrl can be a base64 data URL — allow up to 15MB (approx 20MB base64)
  const imageUrl = typeof b.imageUrl === 'string' && b.imageUrl.startsWith('data:image/')
    ? b.imageUrl.slice(0, 20_000_000)
    : undefined;

  if (!text && !linkUrl && !imageUrl) {
    errors.push({ field: 'content', message: 'At least one of text, linkUrl, or image is required.' });
  }

  if (linkUrl && !isSafeUrl(linkUrl)) {
    errors.push({ field: 'linkUrl', message: 'Link URL must use http or https protocol.' });
  }

  return { errors, cleaned: { text: text || undefined, linkUrl, imageUrl, senderContact } };
}

// Validate persisted message body (POST /api/messages)
export function validateMessageBody(body: unknown): { errors: ValidationError[]; cleaned: any } {
  const errors: ValidationError[] = [];
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

  const senderMemberId = sanitizeString(b.senderMemberId || '', 64);
  const senderName = sanitizeString(b.senderName || '', 100);
  const senderRelation = sanitizeString(b.senderRelation || 'Member', 50);
  const senderContact = sanitizeString(b.senderContact || '', 100);
  const originalText = sanitizeString(b.originalText || '', 5000);
  const linkUrl = typeof b.linkUrl === 'string' ? b.linkUrl.slice(0, 2048) : undefined;
  const screenshotUrl = typeof b.screenshotUrl === 'string' && b.screenshotUrl.startsWith('data:image/')
    ? b.screenshotUrl.slice(0, 20_000_000)
    : undefined;

  if (!senderMemberId) errors.push({ field: 'senderMemberId', message: 'senderMemberId is required.' });
  if (!originalText && !linkUrl && !screenshotUrl) {
    errors.push({ field: 'content', message: 'Message must have text, URL, or screenshot.' });
  }

  const analysis = b.analysis && typeof b.analysis === 'object' ? b.analysis as Record<string, unknown> : null;
  if (!analysis) errors.push({ field: 'analysis', message: 'Analysis result is required.' });

  return {
    errors,
    cleaned: {
      senderMemberId,
      senderName,
      senderRelation,
      senderContact,
      originalText,
      linkUrl,
      screenshotUrl,
      analysis,
    },
  };
}
