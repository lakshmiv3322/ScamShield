import express from 'express';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';

import { initDb } from './server/db/schema.js';
import { getDb } from './server/db/client.js';
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
import { cleanupFamilyRetention, getFamilyMembers } from './server/db/queries/family.js';
import { getMessageById } from './server/db/queries/messages.js';
import { dispatchFamilyThreatAlert } from './server/services/notifications.js';
import { whatsAppService } from './server/services/whatsapp.js';
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
const isProd = process.env.NODE_ENV === 'production';
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: isProd ? ["'self'"] : ["'self'", "'unsafe-inline'"],
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

// POST /api/alerts/broadcast — Real Multi-Channel Family Defense Broadcast (Push, Email, WhatsApp)
app.post('/api/alerts/broadcast', async (req, res) => {
  try {
    const { messageId, familyId: bodyFamilyId } = req.body;
    const sessionFamilyId = (req.session as any)?.familyId;
    let targetFamilyId = bodyFamilyId || sessionFamilyId;

    let targetMessage = messageId ? getMessageById(messageId) : null;
    if (targetMessage && !targetFamilyId) {
      targetFamilyId = targetMessage.familyId;
    }

    if (!targetFamilyId) {
      const firstFam = getDb().prepare('SELECT id FROM families LIMIT 1').get() as any;
      targetFamilyId = firstFam?.id || 'fam_sharma_01';
    }

    // Retrieve active family members configured to receive alerts
    const allMembers = getFamilyMembers(targetFamilyId);
    const alertRecipients = allMembers.filter((m) => Boolean(m.receive_alerts));

    const alertObj = {
      id: `alert_bc_${Date.now()}`,
      messageId: messageId || `msg_bc_${Date.now()}`,
      riskLevel: targetMessage?.analysis?.riskLevel || 'scam',
      title: targetMessage?.analysis?.scamType
        ? `${targetMessage.analysis.scamType} Emergency Advisory`
        : 'High-Risk Scam Threat Broadcast',
      description: targetMessage?.originalText
        ? `Emergency Alert: "${targetMessage.originalText.slice(0, 75)}..."`
        : 'High-risk scam forward flagged. Family defense broadcast active.',
      affectedMemberName: targetMessage?.senderName || 'Family Member',
      affectedMemberRelation: targetMessage?.senderRelation || 'Protected Circle',
      scamType: targetMessage?.analysis?.scamType || 'High Risk Scam',
    };

    // 1. Dispatch Web Push & Email Fallback to all enrolled devices & inboxes
    const notifResult = await dispatchFamilyThreatAlert({
      familyId: targetFamilyId,
      alert: alertObj,
      originalText: targetMessage?.originalText,
      actionableAdvice: targetMessage?.analysis?.actionableAdvice || 'Do NOT click links, send OTPs, or transfer money. Verify with your family admin.',
    });

    // 2. Dispatch WhatsApp Outbound Advisories to family members with registered phone numbers
    let whatsappDispatchedCount = 0;
    const whatsappBody =
      `🚨 *SCAMSHIELD EMERGENCY FAMILY DEFENSE BROADCAST*\n\n` +
      `An urgent high-risk scam threat was detected in your family circle:\n` +
      `*Threat:* ${alertObj.title}\n` +
      `*Target:* ${alertObj.affectedMemberName} (${alertObj.affectedMemberRelation})\n` +
      `*Summary:* ${alertObj.description}\n\n` +
      `👉 *Action Required:* Do NOT click any links, share OTPs, or transfer money. Verify directly with your family admin.\n\n` +
      `🛡️ _Dispatched via ScamShield Real-Time Defense Network_`;

    for (const member of alertRecipients) {
      if (member.phone) {
        try {
          await whatsAppService.sendMessage({
            to: member.phone,
            body: whatsappBody,
          });
          whatsappDispatchedCount++;
        } catch (err) {
          console.warn(`[Broadcast] WhatsApp dispatch failed for ${member.name}:`, err);
        }
      }
    }

    const totalChannels = notifResult.pushCount + notifResult.emailCount + whatsappDispatchedCount;
    const recipientsCount = alertRecipients.length > 0 ? alertRecipients.length : 1;

    res.json({
      success: true,
      message: `Emergency alert successfully broadcast across ${recipientsCount} family members (${notifResult.pushCount} Web Push, ${notifResult.emailCount} Email, ${whatsappDispatchedCount} WhatsApp).`,
      dispatchedCount: recipientsCount,
      pushCount: notifResult.pushCount,
      emailCount: notifResult.emailCount,
      whatsappCount: whatsappDispatchedCount,
      totalChannels,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Broadcast error:', err);
    res.status(500).json({ error: 'Broadcast failed', details: err.message });
  }
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
