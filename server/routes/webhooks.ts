// server/routes/webhooks.ts
import { Router } from 'express';
import { runFraudAnalysis } from '../services/analyzer.js';
import { whatsAppService } from '../services/whatsapp.js';
import { getMemberByPhone, incrementMemberAnalysisCount } from '../db/queries/family.js';
import { createMessage, createAnalysis } from '../db/queries/messages.js';
import { createAlert } from '../db/queries/alerts.js';
import { dispatchFamilyThreatAlert } from '../services/notifications.js';
import { webhookRateLimit } from '../middleware/rateLimiter.js';

export const webhooksRouter = Router();

webhooksRouter.use(webhookRateLimit);

// GET /api/webhooks/whatsapp — Meta Webhook Verification
webhooksRouter.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'scamshield_verify_token';

  if (mode && token) {
    if (mode === 'subscribe' && token === expectedToken) {
      console.log('✅ [WhatsApp Webhook] Verification successful');
      res.status(200).send(challenge);
      return;
    } else {
      console.warn('❌ [WhatsApp Webhook] Verification token mismatch');
      res.sendStatus(403);
      return;
    }
  }

  res.status(400).json({ error: 'Missing hub.mode or hub.verify_token' });
});

// POST /api/webhooks/whatsapp — Receive incoming messages from WhatsApp Cloud API
webhooksRouter.post('/whatsapp', async (req, res) => {
  try {
    const body = req.body;

    // Acknowledge immediately to WhatsApp server to avoid retries
    res.status(200).json({ status: 'received' });

    // Handle Meta standard payload structure or flat test payload
    let incomingMessage: {
      from: string;
      text?: string;
      imageUrl?: string;
      linkUrl?: string;
      messageId?: string;
    } | null = null;

    if (body.entry && Array.isArray(body.entry)) {
      const entry = body.entry[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const msg = value?.messages?.[0];

      if (msg) {
        let text = '';
        let imageUrl: string | undefined = undefined;

        if (msg.type === 'text' && msg.text?.body) {
          text = msg.text.body;
        } else if (msg.type === 'image') {
          text = msg.image?.caption || '';
          imageUrl = msg.image?.id ? `https://whatsapp-media-id:${msg.image.id}` : undefined;
        }

        // Extract potential link from text
        const urlMatch = text.match(/https?:\/\/[^\s]+/i);
        const linkUrl = urlMatch ? urlMatch[0] : undefined;

        incomingMessage = {
          from: msg.from,
          text,
          imageUrl,
          linkUrl,
          messageId: msg.id,
        };
      }
    } else if (body.from && (body.text || body.imageUrl)) {
      // Support flat test payload for direct API testing
      const text = typeof body.text === 'string' ? body.text : body.text?.body || '';
      const urlMatch = text.match(/https?:\/\/[^\s]+/i);
      incomingMessage = {
        from: String(body.from),
        text,
        imageUrl: body.imageUrl,
        linkUrl: body.linkUrl || (urlMatch ? urlMatch[0] : undefined),
        messageId: body.messageId || `test_${Date.now()}`,
      };
    }

    if (!incomingMessage || (!incomingMessage.text && !incomingMessage.imageUrl)) {
      // Notification or delivery receipt, no action required
      return;
    }

    const { from, text, imageUrl, linkUrl } = incomingMessage;
    console.log(`\n📥 [WhatsApp Webhook] Incoming message from: ${from}`);
    console.log(`   Text: "${text}"`);

    // 1. Look up family member by phone number
    const member = getMemberByPhone(from);

    if (!member) {
      console.warn(`[WhatsApp Webhook] No registered family member found for phone: ${from}`);
      // Send friendly registration guidance reply via WhatsApp
      await whatsAppService.sendMessage({
        to: from,
        body: `🛡️ *ScamShield Family Guard*\n\nHello! This WhatsApp number is not yet linked to an active ScamShield Family Circle.\n\nAsk your family guardian to send you an invite link, or open ScamShield in your browser to start protecting your family.`,
      });
      return;
    }

    // 2. Run AI Fraud Analysis
    const { analysis, source } = await runFraudAnalysis({
      text,
      linkUrl,
      imageUrl,
      senderContact: from,
    });

    const newMessageId = `msg_wa_${Date.now()}`;
    const newAnalysisId = `an_wa_${Date.now()}`;

    // 3. Persist to Database
    createMessage({
      id: newMessageId,
      familyId: member.family_id,
      senderMemberId: member.id,
      senderName: member.name,
      senderRelation: member.relation,
      senderContact: from,
      originalText: text,
      linkUrl,
      screenshotUrl: imageUrl,
      contentSource: 'whatsapp',
      contentSenderNumber: from,
      status: analysis.riskLevel === 'safe' ? 'cleared' : 'flagged',
      receivedAt: new Date().toISOString(),
    });

    createAnalysis({
      id: newAnalysisId,
      messageId: newMessageId,
      riskScore: analysis.riskScore,
      riskLevel: analysis.riskLevel,
      scamType: analysis.scamType,
      plainLanguageTitle: `${analysis.scamType} Notice`,
      explanationBullets: analysis.plainLanguageExplanation,
      plainLanguageExplanation: analysis.plainLanguageExplanation,
      safeActionAdvice: [analysis.actionableAdvice],
      actionableAdvice: analysis.actionableAdvice,
      matchedPatternName: `WhatsApp Vector #${analysis.scamType}`,
      aiModelVersion: source === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash' : 'ScamShield Heuristic Engine',
      confidenceScore: 0.94,
    });

    incrementMemberAnalysisCount(member.id);

    // 4. Create Alert if Threat Detected & Dispatch Notifications
    if (analysis.riskLevel === 'scam' || analysis.riskLevel === 'caution') {
      const newAlert = {
        id: `alert_wa_${Date.now()}`,
        analysisId: newAnalysisId,
        messageId: newMessageId,
        familyId: member.family_id,
        riskLevel: analysis.riskLevel,
        scamType: analysis.scamType,
        title: `${analysis.scamType} Detected`,
        description: `${member.name} forwarded a suspicious message via WhatsApp: "${(text || '').slice(0, 60)}..."`,
        affectedMemberName: member.name,
        affectedMemberRelation: member.relation,
        isRead: false,
        acknowledgedBy: [],
      };

      createAlert(newAlert);

      dispatchFamilyThreatAlert({
        familyId: member.family_id,
        alert: newAlert,
        originalText: text || '',
        actionableAdvice: analysis.actionableAdvice,
      }).catch((err) => console.error('Error dispatching WhatsApp alert notification:', err));
    }

    // 5. Build and send plain-language WhatsApp response
    const statusEmoji =
      analysis.riskLevel === 'scam'
        ? '🚨 *DANGER: HIGH RISK FRAUD DETECTED*'
        : analysis.riskLevel === 'caution'
        ? '⚠️ *WARNING: UNVERIFIED / PROCEED WITH CAUTION*'
        : '✅ *SAFE: NO KNOWN THREAT DETECTED*';

    const bulletsFormatted = analysis.plainLanguageExplanation
      .map((b) => `• ${b}`)
      .join('\n');

    const replyBody =
      `${statusEmoji}\n\n` +
      `*Type:* ${analysis.scamType}\n` +
      `*Risk Score:* ${analysis.riskScore}/100\n\n` +
      `💡 *Why this is suspicious:*\n${bulletsFormatted}\n\n` +
      `👉 *What to do:*\n${analysis.actionableAdvice}\n\n` +
      `🛡️ _Protected by ScamShield Family AI Guard_`;

    await whatsAppService.sendMessage({
      to: from,
      body: replyBody,
    });
  } catch (err: any) {
    console.error('Error processing WhatsApp webhook:', err);
  }
});
