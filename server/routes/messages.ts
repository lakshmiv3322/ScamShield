// server/routes/messages.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  getMessagesByFamily,
  getMessageById,
  updateMessageFeedback,
  createMessage,
  createAnalysis,
} from '../db/queries/messages.js';
import { createAlert } from '../db/queries/alerts.js';
import { incrementMemberAnalysisCount } from '../db/queries/family.js';
import { dispatchFamilyThreatAlert } from '../services/notifications.js';
import { validateMessageBody } from '../middleware/sanitize.js';

export const messagesRouter = Router();

messagesRouter.use(requireAuth);

// GET /api/messages
messagesRouter.get('/', (req, res) => {
  const familyId = req.familyId!;
  const messages = getMessagesByFamily(familyId);
  res.json({ messages });
});

// GET /api/messages/:id
messagesRouter.get('/:id', (req, res) => {
  const familyId = req.familyId!;
  const message = getMessageById(req.params.id, familyId);
  if (!message) {
    res.status(404).json({ error: 'Message not found.' });
    return;
  }
  res.json({ message });
});

// POST /api/messages
messagesRouter.post('/', (req, res) => {
  try {
    const familyId = req.familyId!;

    const { errors, cleaned } = validateMessageBody(req.body);
    if (errors.length > 0) {
      res.status(400).json({ error: errors[0].message, details: errors });
      return;
    }

    const {
      senderMemberId,
      senderName,
      senderRelation,
      senderContact,
      originalText,
      linkUrl,
      screenshotUrl,
      analysis,
    } = cleaned;

    const messageId = req.body?.id || `msg_${Date.now()}`;

    createMessage({
      id: messageId,
      familyId,
      senderMemberId: senderMemberId || req.memberId!,
      senderName: senderName || req.user!.name,
      senderRelation: senderRelation || 'Member',
      senderContact,
      originalText,
      linkUrl,
      screenshotUrl,
      contentSource: 'whatsapp',
      contentSenderNumber: senderContact,
      status: status || (analysis?.riskLevel === 'safe' ? 'cleared' : 'flagged'),
      receivedAt: new Date().toISOString(),
    });

    if (analysis) {
      createAnalysis({
        id: analysis.id || `an_${Date.now()}`,
        messageId,
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        scamType: analysis.scamType,
        scamTypeLabel: analysis.scamTypeLabel,
        plainLanguageTitle: analysis.plainLanguageTitle,
        explanationBullets: analysis.explanationBullets || [],
        plainLanguageExplanation: analysis.plainLanguageExplanation,
        safeActionAdvice: analysis.safeActionAdvice || [],
        actionableAdvice: analysis.actionableAdvice,
        familyCrossMatchCount: analysis.familyCrossMatchCount || 0,
        matchedPatternName: analysis.matchedPatternName,
        aiModelVersion: analysis.aiModelVersion || 'Gemini 2.5 Flash',
        confidenceScore: analysis.confidenceScore || 0.9,
      });

      // If high risk or caution, also record alert in DB & dispatch push/email
      if (analysis.riskLevel === 'scam' || analysis.riskLevel === 'caution') {
        const newAlert = {
          id: `alert_${Date.now()}`,
          analysisId: analysis.id || `an_${Date.now()}`,
          messageId,
          familyId,
          riskLevel: analysis.riskLevel,
          title: `${analysis.scamType} Detected`,
          description: `Incoming forward to ${senderName || 'Family'} contains deceptive indicators.`,
          affectedMemberName: senderName || 'Family Member',
          affectedMemberRelation: senderRelation || 'Member',
          scamType: analysis.scamType,
          isRead: false,
          acknowledgedBy: [],
        };

        createAlert(newAlert);

        // Dispatch real-time web-push & email fallback to family members
        dispatchFamilyThreatAlert({
          familyId,
          alert: newAlert,
          originalText,
          actionableAdvice: analysis.actionableAdvice,
        }).catch((err) => console.error('Alert notification dispatch error:', err));
      }
    }

    if (senderMemberId) {
      incrementMemberAnalysisCount(senderMemberId);
    }

    const savedMessage = getMessageById(messageId, familyId);
    res.status(201).json({ message: savedMessage });
  } catch (err: any) {
    console.error('Error saving message:', err);
    res.status(500).json({ error: 'Failed to save message', details: err.message });
  }
});

// PATCH /api/messages/:id/feedback
messagesRouter.patch('/:id/feedback', (req, res) => {
  const familyId = req.familyId!;
  const { feedback } = req.body;
  if (!feedback) {
    res.status(400).json({ error: 'Feedback string is required.' });
    return;
  }

  updateMessageFeedback(req.params.id, familyId, feedback);
  res.json({ success: true, messageId: req.params.id, feedback });
});
