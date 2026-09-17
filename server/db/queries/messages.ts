// server/db/queries/messages.ts
import { getDb } from '../client.js';

export function createMessage(msg: {
  id: string;
  familyId: string;
  senderMemberId: string;
  senderName: string;
  senderRelation: string;
  senderContact?: string;
  originalText?: string;
  linkUrl?: string;
  screenshotUrl?: string;
  contentSource?: string;
  contentSenderNumber?: string;
  status?: string;
  receivedAt?: string;
}) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO messages (
      id, family_id, sender_member_id, sender_name, sender_relation, sender_contact,
      original_text, link_url, screenshot_url, content_source, content_sender_number,
      status, received_at
    )
    VALUES (
      @id, @familyId, @senderMemberId, @senderName, @senderRelation, @senderContact,
      @originalText, @linkUrl, @screenshotUrl, @contentSource, @contentSenderNumber,
      @status, @receivedAt
    )
  `);

  stmt.run({
    id: msg.id,
    familyId: msg.familyId,
    senderMemberId: msg.senderMemberId,
    senderName: msg.senderName,
    senderRelation: msg.senderRelation,
    senderContact: msg.senderContact || null,
    originalText: msg.originalText || null,
    linkUrl: msg.linkUrl || null,
    screenshotUrl: msg.screenshotUrl || null,
    contentSource: msg.contentSource || 'whatsapp',
    contentSenderNumber: msg.contentSenderNumber || null,
    status: msg.status || 'analyzing',
    receivedAt: msg.receivedAt || new Date().toISOString(),
  });
}

export function createAnalysis(analysis: {
  id: string;
  messageId: string;
  riskScore: number;
  riskLevel: string;
  scamType: string;
  scamTypeLabel?: string;
  plainLanguageTitle?: string;
  explanationBullets: string[];
  plainLanguageExplanation?: string[];
  safeActionAdvice: string[];
  actionableAdvice?: string;
  familyCrossMatchCount?: number;
  matchedPatternName?: string;
  aiModelVersion?: string;
  confidenceScore?: number;
  createdAt?: string;
}) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO analyses (
      id, message_id, risk_score, risk_level, scam_type, scam_type_label,
      plain_language_title, explanation_bullets, plain_language_explanation,
      safe_action_advice, actionable_advice, family_cross_match_count,
      matched_pattern_name, ai_model_version, confidence_score, created_at
    )
    VALUES (
      @id, @messageId, @riskScore, @riskLevel, @scamType, @scamTypeLabel,
      @plainLanguageTitle, @explanationBullets, @plainLanguageExplanation,
      @safeActionAdvice, @actionableAdvice, @familyCrossMatchCount,
      @matchedPatternName, @aiModelVersion, @confidenceScore, @createdAt
    )
  `);

  stmt.run({
    id: analysis.id,
    messageId: analysis.messageId,
    riskScore: analysis.riskScore,
    riskLevel: analysis.riskLevel,
    scamType: analysis.scamType,
    scamTypeLabel: analysis.scamTypeLabel || analysis.scamType,
    plainLanguageTitle: analysis.plainLanguageTitle || `${analysis.scamType} Notice`,
    explanationBullets: JSON.stringify(analysis.explanationBullets || []),
    plainLanguageExplanation: analysis.plainLanguageExplanation ? JSON.stringify(analysis.plainLanguageExplanation) : JSON.stringify(analysis.explanationBullets || []),
    safeActionAdvice: JSON.stringify(analysis.safeActionAdvice || []),
    actionableAdvice: analysis.actionableAdvice || analysis.safeActionAdvice?.[0] || null,
    familyCrossMatchCount: analysis.familyCrossMatchCount || 0,
    matchedPatternName: analysis.matchedPatternName || `Threat Vector #${analysis.scamType}`,
    aiModelVersion: analysis.aiModelVersion || 'Gemini 2.5 Flash',
    confidenceScore: analysis.confidenceScore || 0.85,
    createdAt: analysis.createdAt || new Date().toISOString(),
  });
}

function parseRowToMessageItem(row: any) {
  let analysis = undefined;
  if (row.analysis_id) {
    let explanationBullets: string[] = [];
    let plainLanguageExplanation: string[] = [];
    let safeActionAdvice: string[] = [];

    try { explanationBullets = JSON.parse(row.explanation_bullets || '[]'); } catch (_) {}
    try { plainLanguageExplanation = JSON.parse(row.plain_language_explanation || '[]'); } catch (_) {}
    try { safeActionAdvice = JSON.parse(row.safe_action_advice || '[]'); } catch (_) {}

    analysis = {
      id: row.analysis_id,
      messageId: row.id,
      riskScore: row.risk_score,
      riskLevel: row.risk_level,
      scamType: row.scam_type,
      scamTypeLabel: row.scam_type_label,
      plainLanguageTitle: row.plain_language_title,
      explanationBullets,
      plainLanguageExplanation: plainLanguageExplanation.length > 0 ? plainLanguageExplanation : explanationBullets,
      safeActionAdvice,
      actionableAdvice: row.actionable_advice || safeActionAdvice[0] || '',
      familyCrossMatchCount: row.family_cross_match_count || 0,
      matchedPatternName: row.matched_pattern_name || '',
      aiModelVersion: row.ai_model_version || '',
      createdAt: row.analysis_created_at || row.received_at,
      confidenceScore: row.confidence_score || 0.8,
    };
  }

  return {
    id: row.id,
    familyId: row.family_id,
    senderMemberId: row.sender_member_id,
    senderName: row.sender_name,
    senderRelation: row.sender_relation,
    senderContact: row.sender_contact || undefined,
    originalText: row.original_text || undefined,
    linkUrl: row.link_url || undefined,
    screenshotUrl: row.screenshot_url || undefined,
    timestamp: 'Recently',
    userFeedback: row.user_feedback || undefined,
    status: row.status,
    receivedAt: row.received_at,
    content: {
      source: row.content_source || 'whatsapp',
      text: row.original_text || undefined,
      linkUrl: row.link_url || undefined,
      imageUrl: row.screenshot_url || undefined,
      senderNumber: row.content_sender_number || undefined,
    },
    analysis,
  };
}

export function getMessagesByFamily(familyId: string) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT 
      m.*,
      a.id as analysis_id,
      a.risk_score,
      a.risk_level,
      a.scam_type,
      a.scam_type_label,
      a.plain_language_title,
      a.explanation_bullets,
      a.plain_language_explanation,
      a.safe_action_advice,
      a.actionable_advice,
      a.family_cross_match_count,
      a.matched_pattern_name,
      a.ai_model_version,
      a.confidence_score,
      a.created_at as analysis_created_at
    FROM messages m
    LEFT JOIN analyses a ON m.id = a.message_id
    WHERE m.family_id = ?
    ORDER BY m.received_at DESC
  `);

  const rows = stmt.all(familyId);
  return rows.map(parseRowToMessageItem);
}

export function getMessageById(messageId: string, familyId?: string) {
  const db = getDb();
  let query = `
    SELECT 
      m.*,
      a.id as analysis_id,
      a.risk_score,
      a.risk_level,
      a.scam_type,
      a.scam_type_label,
      a.plain_language_title,
      a.explanation_bullets,
      a.plain_language_explanation,
      a.safe_action_advice,
      a.actionable_advice,
      a.family_cross_match_count,
      a.matched_pattern_name,
      a.ai_model_version,
      a.confidence_score,
      a.created_at as analysis_created_at
    FROM messages m
    LEFT JOIN analyses a ON m.id = a.message_id
    WHERE m.id = ?
  `;
  const params: any[] = [messageId];

  if (familyId) {
    query += ' AND m.family_id = ?';
    params.push(familyId);
  }

  const row = db.prepare(query).get(...params);
  return row ? parseRowToMessageItem(row) : null;
}

export function updateMessageFeedback(messageId: string, familyId: string, feedback: string) {
  const db = getDb();
  const stmt = db.prepare('UPDATE messages SET user_feedback = ? WHERE id = ? AND family_id = ?');
  stmt.run(feedback, messageId, familyId);
}
