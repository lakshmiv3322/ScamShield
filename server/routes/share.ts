// server/routes/share.ts
import { Router } from 'express';
import multer from 'multer';
import { runFraudAnalysis } from '../services/analyzer.js';
import { getMemberByUserId, getFamilyMembers } from '../db/queries/family.js';
import { createMessage, createAnalysis } from '../db/queries/messages.js';
import { createAlert } from '../db/queries/alerts.js';
import { getDb } from '../db/client.js';
import { dispatchFamilyThreatAlert } from '../services/notifications.js';
import { shareRateLimit } from '../middleware/rateLimiter.js';

export const shareRouter = Router();

shareRouter.use(shareRateLimit);

// Configure multer with memory storage (up to 15MB images)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// Helper to process shared content
async function processSharedContent(params: {
  userId?: string;
  title?: string;
  text?: string;
  url?: string;
  file?: Express.Multer.File;
}): Promise<string | null> {
  const { userId, title, text, url, file } = params;

  // Combine title, text, and url
  let combinedText = '';
  if (text) combinedText = text;
  else if (title) combinedText = title;

  let linkUrl = url;
  if (!linkUrl && combinedText) {
    const match = combinedText.match(/https?:\/\/[^\s]+/i);
    if (match) linkUrl = match[0];
  }

  let imageUrl: string | undefined = undefined;
  if (file && file.mimetype.startsWith('image/')) {
    imageUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  }

  if (!combinedText && !linkUrl && !imageUrl) {
    return null;
  }

  // Find member & family
  let member = userId ? getMemberByUserId(userId) : null;

  // Fallback: If unauthenticated, use the primary family admin so the shared scam isn't lost
  if (!member) {
    const db = getDb();
    const firstFamily = db.prepare('SELECT id FROM families LIMIT 1').get() as { id: string } | undefined;
    if (firstFamily) {
      const members = getFamilyMembers(firstFamily.id);
      member = members[0] || null;
    }
  }

  if (!member) {
    return null;
  }

  // Run Fraud Analysis
  const { analysis, source } = await runFraudAnalysis({
    text: combinedText,
    linkUrl,
    imageUrl,
    senderContact: 'Web Share Target',
  });

  const messageId = `msg_share_${Date.now()}`;
  const analysisId = `an_share_${Date.now()}`;

  createMessage({
    id: messageId,
    familyId: member.family_id,
    senderMemberId: member.id,
    senderName: member.name,
    senderRelation: member.relation,
    senderContact: member.phone || 'Web Share Target',
    originalText: combinedText,
    linkUrl,
    screenshotUrl: imageUrl,
    contentSource: 'web_share',
    contentSenderNumber: member.phone,
    status: analysis.riskLevel === 'safe' ? 'cleared' : 'flagged',
    receivedAt: new Date().toISOString(),
  });

  createAnalysis({
    id: analysisId,
    messageId,
    riskScore: analysis.riskScore,
    riskLevel: analysis.riskLevel,
    scamType: analysis.scamType,
    plainLanguageTitle: `${analysis.scamType} Notice`,
    explanationBullets: analysis.plainLanguageExplanation,
    plainLanguageExplanation: analysis.plainLanguageExplanation,
    safeActionAdvice: [analysis.actionableAdvice],
    actionableAdvice: analysis.actionableAdvice,
    matchedPatternName: `Share Vector #${analysis.scamType}`,
    aiModelVersion: source === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash' : 'ScamShield Heuristic Engine',
    confidenceScore: 0.95,
  });

  if (analysis.riskLevel === 'scam' || analysis.riskLevel === 'caution') {
    const newAlert = {
      id: `alert_share_${Date.now()}`,
      analysisId,
      messageId,
      familyId: member.family_id,
      riskLevel: analysis.riskLevel,
      scamType: analysis.scamType,
      title: `${analysis.scamType} Detected`,
      description: `New message shared directly to ScamShield: "${(combinedText || linkUrl || 'Attachment').slice(0, 60)}..."`,
      affectedMemberName: member.name,
      affectedMemberRelation: member.relation,
      isRead: false,
      acknowledgedBy: [],
    };

    createAlert(newAlert);

    dispatchFamilyThreatAlert({
      familyId: member.family_id,
      alert: newAlert,
      originalText: combinedText,
      actionableAdvice: analysis.actionableAdvice,
    }).catch((err) => console.error('Error dispatching share alert notification:', err));
  }

  return messageId;
}

// POST /share — Web Share Target API Endpoint
shareRouter.post('/', upload.single('media'), async (req, res) => {
  try {
    const { title, text, url } = req.body;
    const file = req.file;

    const messageId = await processSharedContent({
      userId: req.session?.userId,
      title,
      text,
      url,
      file,
    });

    if (messageId) {
      res.redirect(`/?messageId=${messageId}`);
      return;
    }

    res.redirect('/');
  } catch (err: any) {
    console.error('Error handling Web Share Target:', err);
    res.redirect('/');
  }
});

// GET /share — Fallback for GET share requests
shareRouter.get('/', async (req, res) => {
  try {
    const title = req.query.title as string | undefined;
    const text = req.query.text as string | undefined;
    const url = req.query.url as string | undefined;

    const messageId = await processSharedContent({
      userId: req.session?.userId,
      title,
      text,
      url,
    });

    if (messageId) {
      res.redirect(`/?messageId=${messageId}`);
      return;
    }

    res.redirect('/');
  } catch (err: any) {
    console.error('Error handling GET Web Share:', err);
    res.redirect('/');
  }
});
