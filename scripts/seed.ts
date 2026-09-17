// scripts/seed.ts
// Inserts seed mock data from src/mock/data.ts into the SQLite database.
// Safe to re-run (uses INSERT OR IGNORE / ON CONFLICT).

import bcrypt from 'bcryptjs';
import { initDb } from '../server/db/schema.js';
import { getDb } from '../server/db/client.js';
import {
  initialUser,
  initialFamily,
  initialFamilyMembers,
  initialMessages,
  initialAlerts,
} from '../src/mock/data.js';

async function seed() {
  console.log('🌱 Initializing schema...');
  initDb();

  const db = getDb();

  console.log('🌱 Seeding user...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (
      id, name, email, password_hash, phone, role, relation, avatar_url, elder_mode_enabled, created_at
    ) VALUES (
      @id, @name, @email, @passwordHash, @phone, @role, @relation, @avatarUrl, @elderModeEnabled, @createdAt
    )
  `);

  insertUser.run({
    id: initialUser.id,
    name: initialUser.name,
    email: initialUser.email.toLowerCase(),
    passwordHash,
    phone: initialUser.phone,
    role: initialUser.role,
    relation: initialUser.relation,
    avatarUrl: initialUser.avatarUrl,
    elderModeEnabled: initialUser.elderModeEnabled ? 1 : 0,
    createdAt: initialUser.createdAt,
  });

  // Also create user accounts for remaining family members so they exist in users table
  for (const m of initialFamilyMembers) {
    if (m.userId !== initialUser.id) {
      insertUser.run({
        id: m.userId,
        name: m.name,
        email: `${m.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        passwordHash,
        phone: m.phone || null,
        role: m.role,
        relation: m.relation,
        avatarUrl: m.avatarUrl,
        elderModeEnabled: 0,
        createdAt: m.joinedAt,
      });
    }
  }

  console.log('🌱 Seeding family...');
  const insertFamily = db.prepare(`
    INSERT OR REPLACE INTO families (
      id, name, code, admin_user_id, elder_mode_default, retention_days, created_at
    ) VALUES (
      @id, @name, @code, @adminUserId, @elderModeDefault, 90, @createdAt
    )
  `);

  insertFamily.run({
    id: initialFamily.id,
    name: initialFamily.name,
    code: initialFamily.code,
    adminUserId: initialFamily.adminUserId,
    elderModeDefault: initialFamily.elderModeDefault ? 1 : 0,
    createdAt: initialFamily.createdAt,
  });

  console.log('🌱 Seeding family members...');
  const insertMember = db.prepare(`
    INSERT OR REPLACE INTO family_members (
      id, family_id, user_id, name, relation, role, avatar_url, phone,
      receive_alerts, messages_analyzed_this_week, threat_status, joined_at
    ) VALUES (
      @id, @familyId, @userId, @name, @relation, @role, @avatarUrl, @phone,
      @receiveAlerts, @messagesAnalyzedThisWeek, @threatStatus, @joinedAt
    )
  `);

  for (const m of initialFamilyMembers) {
    insertMember.run({
      id: m.id,
      familyId: m.familyId,
      userId: m.userId,
      name: m.name,
      relation: m.relation,
      role: m.role,
      avatarUrl: m.avatarUrl,
      phone: m.phone || null,
      receiveAlerts: m.receiveAlerts ? 1 : 0,
      messagesAnalyzedThisWeek: m.messagesAnalyzedThisWeek,
      threatStatus: m.threatStatus,
      joinedAt: m.joinedAt,
    });
  }

  console.log('🌱 Seeding messages and analyses...');
  const insertMsg = db.prepare(`
    INSERT OR REPLACE INTO messages (
      id, family_id, sender_member_id, sender_name, sender_relation, sender_contact,
      original_text, link_url, screenshot_url, content_source, content_sender_number,
      status, received_at
    ) VALUES (
      @id, @familyId, @senderMemberId, @senderName, @senderRelation, @senderContact,
      @originalText, @linkUrl, @screenshotUrl, @contentSource, @contentSenderNumber,
      @status, @receivedAt
    )
  `);

  const insertAnalysis = db.prepare(`
    INSERT OR REPLACE INTO analyses (
      id, message_id, risk_score, risk_level, scam_type, scam_type_label,
      plain_language_title, explanation_bullets, plain_language_explanation,
      safe_action_advice, actionable_advice, family_cross_match_count,
      matched_pattern_name, ai_model_version, confidence_score, created_at
    ) VALUES (
      @id, @messageId, @riskScore, @riskLevel, @scamType, @scamTypeLabel,
      @plainLanguageTitle, @explanationBullets, @plainLanguageExplanation,
      @safeActionAdvice, @actionableAdvice, @familyCrossMatchCount,
      @matchedPatternName, @aiModelVersion, @confidenceScore, @createdAt
    )
  `);

  for (const msg of initialMessages) {
    insertMsg.run({
      id: msg.id,
      familyId: msg.familyId,
      senderMemberId: msg.senderMemberId,
      senderName: msg.senderName,
      senderRelation: msg.senderRelation,
      senderContact: msg.senderContact || null,
      originalText: msg.originalText || null,
      linkUrl: msg.linkUrl || null,
      screenshotUrl: msg.screenshotUrl || null,
      contentSource: msg.content.source || 'whatsapp',
      contentSenderNumber: msg.content.senderNumber || null,
      status: msg.status,
      receivedAt: msg.receivedAt,
    });

    if (msg.analysis) {
      insertAnalysis.run({
        id: msg.analysis.id,
        messageId: msg.id,
        riskScore: msg.analysis.riskScore,
        riskLevel: msg.analysis.riskLevel,
        scamType: msg.analysis.scamType,
        scamTypeLabel: msg.analysis.scamTypeLabel,
        plainLanguageTitle: msg.analysis.plainLanguageTitle,
        explanationBullets: JSON.stringify(msg.analysis.explanationBullets || []),
        plainLanguageExplanation: JSON.stringify(msg.analysis.plainLanguageExplanation || msg.analysis.explanationBullets || []),
        safeActionAdvice: JSON.stringify(msg.analysis.safeActionAdvice || []),
        actionableAdvice: msg.analysis.actionableAdvice || msg.analysis.safeActionAdvice?.[0] || null,
        familyCrossMatchCount: msg.analysis.familyCrossMatchCount || 0,
        matchedPatternName: msg.analysis.matchedPatternName || '',
        aiModelVersion: msg.analysis.aiModelVersion || 'Gemini 2.5 Flash',
        confidenceScore: msg.analysis.confidenceScore || 0.9,
        createdAt: msg.analysis.createdAt || msg.receivedAt,
      });
    }
  }

  console.log('🌱 Seeding alerts...');
  const insertAlert = db.prepare(`
    INSERT OR REPLACE INTO alerts (
      id, analysis_id, message_id, family_id, risk_level, title, description,
      affected_member_name, affected_member_relation, scam_type, timestamp,
      is_read, acknowledged_by
    ) VALUES (
      @id, @analysisId, @messageId, @familyId, @riskLevel, @title, @description,
      @affectedMemberName, @affectedMemberRelation, @scamType, @timestamp,
      @isRead, @acknowledgedBy
    )
  `);

  for (const a of initialAlerts) {
    insertAlert.run({
      id: a.id,
      analysisId: a.analysisId,
      messageId: a.messageId,
      familyId: a.familyId,
      riskLevel: a.riskLevel,
      title: a.title,
      description: a.description,
      affectedMemberName: a.affectedMemberName,
      affectedMemberRelation: a.affectedMemberRelation,
      scamType: a.scamType,
      timestamp: a.timestamp,
      isRead: a.isRead ? 1 : 0,
      acknowledgedBy: JSON.stringify(a.acknowledgedBy || []),
    });
  }

  console.log('\n✅ Database seeded successfully!');
  console.log('👉 Default login credentials:');
  console.log('   Email:    rahul.sharma@example.com');
  console.log('   Password: password123\n');
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
