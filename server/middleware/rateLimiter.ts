// server/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

const jsonLimitHandler = (req: any, res: any) => {
  res.status(429).json({
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please wait before trying again.',
    retryAfterSeconds: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime - Date.now()) / 1000 : 60),
  });
};

// Auth rate limiters
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: undefined,
  handler: jsonLimitHandler,
  keyGenerator: (req) => {
    // Rate-limit by IP + email combo to prevent distributed login abuse
    const email = req.body?.email || '';
    return `${req.ip || '127.0.0.1'}_${email.toLowerCase().slice(0, 64)}`;
  },
  validate: { keyGeneratorIpFallback: false },
});

export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: undefined,
  handler: jsonLimitHandler,
});

// Analysis rate limiter — 60 requests per minute per IP
export const analyzeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: undefined,
  handler: jsonLimitHandler,
});

// Webhook rate limiter — 200 per minute (Meta sends many small messages)
export const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: undefined,
  handler: jsonLimitHandler,
});

// Share target rate limiter — 30 per minute
export const shareRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: undefined,
  handler: jsonLimitHandler,
});

// Invite generation — 20 per hour
export const inviteRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: undefined,
  handler: jsonLimitHandler,
});

// General API rate limiter — 300 per minute
export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: undefined,
  handler: jsonLimitHandler,
  skip: (req) => req.path.startsWith('/api/health'),
});
