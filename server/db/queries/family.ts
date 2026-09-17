// server/db/queries/family.ts
import { getDb } from '../client.js';

export interface DbFamily {
  id: string;
  name: string;
  code: string;
  admin_user_id: string;
  elder_mode_default: number;
  retention_days: number;
  created_at: string;
}

export interface DbFamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  name: string;
  relation: string;
  role: string;
  avatar_url: string;
  phone?: string;
  receive_alerts: number;
  messages_analyzed_this_week: number;
  threat_status: string;
  joined_at: string;
}

export function createFamily(family: {
  id: string;
  name: string;
  code: string;
  adminUserId: string;
  elderModeDefault?: boolean;
}): DbFamily {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO families (id, name, code, admin_user_id, elder_mode_default, retention_days, created_at)
    VALUES (@id, @name, @code, @adminUserId, @elderModeDefault, 90, datetime('now'))
  `);

  stmt.run({
    id: family.id,
    name: family.name,
    code: family.code.toUpperCase(),
    adminUserId: family.adminUserId,
    elderModeDefault: family.elderModeDefault ? 1 : 0,
  });

  return getFamilyById(family.id)!;
}

export function getFamilyById(id: string): DbFamily | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM families WHERE id = ?');
  return (stmt.get(id) as DbFamily) || null;
}

export function getFamilyByCode(code: string): DbFamily | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM families WHERE UPPER(code) = UPPER(?)');
  return (stmt.get(code) as DbFamily) || null;
}

export function addFamilyMember(member: {
  id: string;
  familyId: string;
  userId: string;
  name: string;
  relation: string;
  role?: string;
  avatarUrl?: string;
  phone?: string;
  receiveAlerts?: boolean;
  threatStatus?: string;
}): DbFamilyMember {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO family_members (
      id, family_id, user_id, name, relation, role, avatar_url, phone,
      receive_alerts, messages_analyzed_this_week, threat_status, joined_at
    )
    VALUES (
      @id, @familyId, @userId, @name, @relation, @role, @avatarUrl, @phone,
      @receiveAlerts, 0, @threatStatus, datetime('now')
    )
  `);

  stmt.run({
    id: member.id,
    familyId: member.familyId,
    userId: member.userId,
    name: member.name,
    relation: member.relation,
    role: member.role || 'member',
    avatarUrl: member.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.name)}`,
    phone: member.phone || null,
    receiveAlerts: member.receiveAlerts !== false ? 1 : 0,
    threatStatus: member.threatStatus || 'protected',
  });

  const getStmt = db.prepare('SELECT * FROM family_members WHERE id = ?');
  return getStmt.get(member.id) as DbFamilyMember;
}

export function getFamilyMembers(familyId: string): DbFamilyMember[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM family_members WHERE family_id = ? ORDER BY joined_at ASC');
  return stmt.all(familyId) as DbFamilyMember[];
}

export function getMemberByUserId(userId: string, familyId?: string): DbFamilyMember | null {
  const db = getDb();
  if (familyId) {
    const stmt = db.prepare('SELECT * FROM family_members WHERE user_id = ? AND family_id = ?');
    return (stmt.get(userId, familyId) as DbFamilyMember) || null;
  }
  const stmt = db.prepare('SELECT * FROM family_members WHERE user_id = ? LIMIT 1');
  return (stmt.get(userId) as DbFamilyMember) || null;
}

export function getMemberByPhone(rawPhone: string): DbFamilyMember | null {
  const db = getDb();
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return null;

  // Last 10 digits match handles +91 / country code variations
  const last10 = digits.slice(-10);

  const stmt = db.prepare('SELECT * FROM family_members WHERE phone IS NOT NULL');
  const allMembers = stmt.all() as DbFamilyMember[];

  return allMembers.find((m) => {
    if (!m.phone) return false;
    const memberDigits = m.phone.replace(/\D/g, '');
    return memberDigits === digits || (last10.length === 10 && memberDigits.endsWith(last10));
  }) || null;
}


export function updateMemberAlerts(memberId: string, familyId: string, receiveAlerts: boolean): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE family_members SET receive_alerts = ? WHERE id = ? AND family_id = ?');
  stmt.run(receiveAlerts ? 1 : 0, memberId, familyId);
}

export function incrementMemberAnalysisCount(memberId: string): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE family_members SET messages_analyzed_this_week = messages_analyzed_this_week + 1 WHERE id = ?');
  stmt.run(memberId);
}

export function getFamilyStats(familyId: string) {
  const db = getDb();
  const msgCountStmt = db.prepare('SELECT COUNT(*) as count FROM messages WHERE family_id = ?');
  const scamCountStmt = db.prepare(`
    SELECT COUNT(*) as count FROM messages m
    JOIN analyses a ON m.id = a.message_id
    WHERE m.family_id = ? AND a.risk_level = 'scam'
  `);
  const memberCountStmt = db.prepare('SELECT COUNT(*) as count FROM family_members WHERE family_id = ?');

  const messagesAnalyzed = (msgCountStmt.get(familyId) as any)?.count || 0;
  const scamsDetected = (scamCountStmt.get(familyId) as any)?.count || 0;
  const membersProtected = (memberCountStmt.get(familyId) as any)?.count || 0;
  const highRiskPercentage = messagesAnalyzed > 0 ? Math.round((scamsDetected / messagesAnalyzed) * 100) : 0;

  return {
    scamsDetectedCount: scamsDetected,
    scamsTrendWeek: scamsDetected,
    messagesAnalyzedCount: messagesAnalyzed,
    familyMembersProtectedCount: membersProtected,
    averageResponseTimeSec: 1.2,
    highRiskPercentage,
  };
}

export function updateFamilyRetention(familyId: string, retentionDays: number): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE families SET retention_days = ? WHERE id = ?');
  stmt.run(retentionDays, familyId);
}

export function cleanupFamilyRetention(familyId?: string): { deletedMessages: number; deletedAlerts: number } {
  const db = getDb();

  // If familyId specified, get its retentionDays; otherwise run for each family
  if (familyId) {
    const fam = getFamilyById(familyId);
    const retentionDays = fam?.retention_days || 90;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

    const delAlerts = db.prepare('DELETE FROM alerts WHERE family_id = ? AND timestamp < ?').run(familyId, cutoffDate);
    const delAnalyses = db.prepare(`
      DELETE FROM analyses WHERE message_id IN (
        SELECT id FROM messages WHERE family_id = ? AND received_at < ?
      )
    `).run(familyId, cutoffDate);
    const delMessages = db.prepare('DELETE FROM messages WHERE family_id = ? AND received_at < ?').run(familyId, cutoffDate);

    console.log(`[Retention Cleanup] Family ${familyId}: pruned messages < ${cutoffDate} (Messages: ${delMessages.changes}, Alerts: ${delAlerts.changes})`);
    return { deletedMessages: delMessages.changes, deletedAlerts: delAlerts.changes };
  }

  // Global cleanup across all families
  const allFamilies = db.prepare('SELECT id, retention_days FROM families').all() as DbFamily[];
  let totalDeletedMessages = 0;
  let totalDeletedAlerts = 0;

  for (const f of allFamilies) {
    const days = f.retention_days || 90;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const delAlerts = db.prepare('DELETE FROM alerts WHERE family_id = ? AND timestamp < ?').run(f.id, cutoffDate);
    db.prepare(`
      DELETE FROM analyses WHERE message_id IN (
        SELECT id FROM messages WHERE family_id = ? AND received_at < ?
      )
    `).run(f.id, cutoffDate);
    const delMessages = db.prepare('DELETE FROM messages WHERE family_id = ? AND received_at < ?').run(f.id, cutoffDate);

    totalDeletedMessages += delMessages.changes;
    totalDeletedAlerts += delAlerts.changes;
  }

  return { deletedMessages: totalDeletedMessages, deletedAlerts: totalDeletedAlerts };
}

