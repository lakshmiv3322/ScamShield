export type RiskLevel = 'safe' | 'caution' | 'scam';

export type ScamType = 
  | 'fake_kyc' 
  | 'electricity_bill' 
  | 'family_impersonation' 
  | 'lottery_tax' 
  | 'phishing_link' 
  | 'bank_otp' 
  | 'job_offer' 
  | 'legitimate';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'member' | 'viewer';
  relation?: string;
  avatarUrl?: string;
  elderModeEnabled: boolean;
  createdAt: string;
}

export interface Family {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  adminUserId: string;
  elderModeDefault: boolean;
  retentionDays?: number;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  name: string;
  relation: string;
  role: 'admin' | 'member' | 'viewer';
  avatarUrl: string;
  phone?: string;
  receiveAlerts: boolean;
  messagesAnalyzedThisWeek: number;
  threatStatus: 'high_target' | 'moderate' | 'protected';
  joinedAt: string;
}

export interface MessageContent {
  text?: string;
  imageUrl?: string;
  linkUrl?: string;
  linkDomain?: string;
  linkTitle?: string;
  source: 'whatsapp' | 'web' | 'sms' | 'call_transcript';
  senderNumber?: string;
}

export interface Analysis {
  id: string;
  messageId: string;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  scamType: ScamType | string;
  scamTypeLabel: string;
  plainLanguageTitle: string;
  explanationBullets: string[];
  plainLanguageExplanation?: string[];
  safeActionAdvice: string[];
  actionableAdvice?: string;
  familyCrossMatchCount: number;
  matchedPatternName: string;
  aiModelVersion: string;
  createdAt: string;
  confidenceScore: number;
}

export interface MessageItem {
  id: string;
  familyId: string;
  senderMemberId: string;
  senderName: string;
  senderRelation: string;
  senderContact?: string;
  originalText?: string;
  linkUrl?: string;
  screenshotUrl?: string;
  timestamp?: string;
  userFeedback?: 'confirmed_scam' | 'marked_safe' | 'not_sure';
  content: MessageContent;
  analysis?: Analysis;
  receivedAt: string;
  status: 'analyzing' | 'flagged' | 'cleared';
}

export interface AlertItem {
  id: string;
  analysisId: string;
  messageId: string;
  familyId: string;
  riskLevel: RiskLevel;
  title: string;
  description: string;
  affectedMemberName: string;
  affectedMemberRelation: string;
  scamType: string;
  timestamp: string;
  isRead: boolean;
  acknowledgedBy: string[];
}

export interface MapRiskPin {
  id: string;
  cityName: string;
  lat: number;
  lng: number;
  riskLevel: RiskLevel;
  scamSnippet: string;
  memberAffected: string;
  scamType: string;
  timestamp: string;
  isPulsing?: boolean;
}

export interface DashboardStats {
  scamsDetectedCount: number;
  scamsTrendWeek: number;
  messagesAnalyzedCount: number;
  familyMembersProtectedCount: number;
  averageResponseTimeSec: number;
  highRiskPercentage: number;
}

export interface UserFeedback {
  id: string;
  analysisId: string;
  userId: string;
  userLabel: 'safe' | 'scam' | 'unsure';
  notes?: string;
  createdAt: string;
}
