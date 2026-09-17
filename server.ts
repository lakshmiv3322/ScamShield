import express from 'express';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';

import { initDb } from './server/db/schema.js';
import { authRouter } from './server/routes/auth.js';
import { familyRouter } from './server/routes/family.js';
import { messagesRouter } from './server/routes/messages.js';
import { alertsRouter } from './server/routes/alerts.js';
import { invitesRouter } from './server/routes/invites.js';
import { webhooksRouter } from './server/routes/webhooks.js';
import { shareRouter } from './server/routes/share.js';
import { notificationsRouter } from './server/routes/notifications.js';
import { mapRouter } from './server/routes/map.js';
import { runFraudAnalysis } from './server/services/analyzer.js';
import { cleanupFamilyRetention } from './server/db/queries/family.js';
import helmet from 'helmet';
import { generalRateLimit, analyzeRateLimit } from './server/middleware/rateLimiter.js';
import { validateAnalyzeBody } from './server/middleware/sanitize.js';

dotenv.config({ path: ['.env.local', '.env'] });

// Initialize SQLite database schema
initDb();

// Schedule nightly retention cleanup (runs every 24h)
setInterval(() => {
  try {
    cleanupFamilyRetention();
  } catch (err) {
    console.error('[Nightly Retention Cleanup Error]', err);
  }
}, 24 * 60 * 60 * 1000);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  console.warn('⚠️ SESSION_SECRET not set — generating a random one for this session; sessions will not persist across restarts');
  sessionSecret = crypto.randomBytes(32).toString('hex');
}
const SESSION_SECRET = sessionSecret;

// Security Headers & Content Security Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://api.dicebear.com', 'https://images.unsplash.com'],
        connectSrc: ["'self'", 'ws:', 'wss:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());
app.use(
  session({
    name: 'scamshield_sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);

// General API Rate Limiting
app.use('/api', generalRateLimit);

// Mount API & Ingestion Route Handlers
app.use('/api/auth', authRouter);
app.use('/api/family', familyRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/invites', invitesRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/map', mapRouter);
app.use('/share', shareRouter);

// Callable admin endpoint for manual retention cleanup
app.post('/api/admin/cleanup', (req, res) => {
  const result = cleanupFamilyRetention();
  res.json({ success: true, ...result });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ScamShield AI Backend',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// AI Fraud Analysis Endpoint
app.post('/api/analyze', analyzeRateLimit, async (req, res) => {
  try {
    const { errors, cleaned } = validateAnalyzeBody(req.body);
    if (errors.length > 0) {
      res.status(400).json({ error: errors[0].message, details: errors });
      return;
    }

    const { text, linkUrl, imageUrl, senderContact } = cleaned;

    const result = await runFraudAnalysis({ text, linkUrl, imageUrl, senderContact });
    res.json({
      success: true,
      analysis: result.analysis,
      source: result.source,
    });
  } catch (err: any) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Analysis failed', details: err.message });
  }
});

// SIMULATED — for demo purposes. Production would call WhatsApp Business API / Twilio here, dispatching to each family member with receiveAlerts=true.
app.post('/api/alerts/broadcast', (req, res) => {
  const { messageId, familyId } = req.body;
  res.json({
    success: true,
    message: 'Emergency alert dispatched to 5 connected family WhatsApp contacts.',
    dispatchedCount: 5,
    timestamp: new Date().toISOString(),
  });
});

// Setup Vite middleware in dev, or serve static dist in prod
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '127.0.0.1', () => {
    console.log(`\n  ✅ ScamShield is running!`);
    console.log(`  ➜  Open in browser: http://localhost:${PORT}\n`);
  });
}

startServer();
