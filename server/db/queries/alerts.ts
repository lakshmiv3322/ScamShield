// server/db/queries/alerts.ts
import { getDb } from '../client.js';

export function createAlert(alert: {
  id: string;
  analysisId: string;
  messageId: string;
  familyId: string;
  riskLevel: string;
  title: string;
  description: string;
  affectedMemberName: string;
  affectedMemberRelation: string;
  scamType: string;
  timestamp?: string;
  isRead?: boolean;
  acknowledgedBy?: string[];
}) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO alerts (
      id, analysis_id, message_id, family_id, risk_level, title, description,
      affected_member_name, affected_member_relation, scam_type, timestamp,
      is_read, acknowledged_by
    )
    VALUES (
      @id, @analysisId, @messageId, @familyId, @riskLevel, @title, @description,
      @affectedMemberName, @affectedMemberRelation, @scamType, @timestamp,
      @isRead, @acknowledgedBy
    )
  `);

  stmt.run({
    id: alert.id,
    analysisId: alert.analysisId,
    messageId: alert.messageId,
    familyId: alert.familyId,
    riskLevel: alert.riskLevel,
    title: alert.title,
    description: alert.description,
    affectedMemberName: alert.affectedMemberName,
    affectedMemberRelation: alert.affectedMemberRelation,
    scamType: alert.scamType,
    timestamp: alert.timestamp || new Date().toISOString(),
    isRead: alert.isRead ? 1 : 0,
    acknowledgedBy: JSON.stringify(alert.acknowledgedBy || []),
  });
}

export function getAlertsByFamily(familyId: string) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM alerts WHERE family_id = ? ORDER BY timestamp DESC');
  const rows = stmt.all(familyId);

  return rows.map((r: any) => {
    let acknowledgedBy: string[] = [];
    try { acknowledgedBy = JSON.parse(r.acknowledged_by || '[]'); } catch (_) {}

    return {
      id: r.id,
      analysisId: r.analysis_id,
      messageId: r.message_id,
      familyId: r.family_id,
      riskLevel: r.risk_level,
      title: r.title,
      description: r.description,
      affectedMemberName: r.affected_member_name,
      affectedMemberRelation: r.affected_member_relation,
      scamType: r.scam_type,
      timestamp: r.timestamp,
      isRead: Boolean(r.is_read),
      acknowledgedBy,
    };
  });
}

export function markAllAlertsRead(familyId: string) {
  const db = getDb();
  const stmt = db.prepare('UPDATE alerts SET is_read = 1 WHERE family_id = ?');
  stmt.run(familyId);
}
