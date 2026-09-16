import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  MessageCircle,
  CheckCircle2,
  HelpCircle,
  Globe,
  BellRing,
  Info,
} from 'lucide-react';
import { MessageItem, FamilyMember, RiskLevel } from '../types';
import { RiskScoreGauge } from '../components/RiskScoreGauge';
import { ThreeShield } from '../components/ThreeShield';

interface MessageDetailPageProps {
  message: MessageItem;
  senderMember?: FamilyMember;
  elderMode: boolean;
  onBack: () => void;
  onUpdateFeedback: (messageId: string, feedback: 'confirmed_scam' | 'marked_safe' | 'not_sure') => void;
  onBroadcastAlert: (messageId: string) => void;
}

export const MessageDetailPage: React.FC<MessageDetailPageProps> = ({
  message,
  senderMember,
  elderMode,
  onBack,
  onUpdateFeedback,
  onBroadcastAlert,
}) => {
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<'confirmed_scam' | 'marked_safe' | 'not_sure' | undefined>(
    message.userFeedback
  );

  const analysis = message.analysis || {
    id: `an_fallback_${message.id}`,
    messageId: message.id,
    riskScore: 50,
    riskLevel: 'caution' as RiskLevel,
    scamType: 'Pending Analysis',
    scamTypeLabel: 'Pending Analysis',
    plainLanguageTitle: 'Analysis Pending',
    explanationBullets: ['Threat evaluation is currently being processed.'],
    plainLanguageExplanation: ['Threat evaluation is currently being processed.'],
    safeActionAdvice: ['Wait for analysis to complete before taking action.'],
    actionableAdvice: 'Exercise caution until analysis completes.',
    familyCrossMatchCount: 0,
    matchedPatternName: 'Pending Scan',
    aiModelVersion: 'Gemini 2.5 Flash',
    createdAt: message.receivedAt || new Date().toISOString(),
    confidenceScore: 0.5,
  };

  const handleFeedback = (type: 'confirmed_scam' | 'marked_safe' | 'not_sure') => {
    setCurrentFeedback(type);
    onUpdateFeedback(message.id, type);
  };

  const handleAlertFamily = () => {
    onBroadcastAlert(message.id);
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 5000);
  };

  return (
    <div className={`space-y-6 pb-20 ${elderMode ? 'elder-mode' : ''}`}>
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#121821] hover:bg-[#1a2330] border border-white/10 text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span onClick={onBack} className="hover:underline cursor-pointer">Dashboard</span>
              <span>/</span>
              <span>Messages</span>
              <span>/</span>
              <span className="text-white font-mono">{message.id}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
              Incident Analysis & Defense
            </h1>
          </div>
        </div>

        {/* Dynamic 3D Miniature Shield Status Indicator */}
        <div className="hidden sm:flex items-center gap-3 bg-[#121821] px-3.5 py-1.5 rounded-2xl border border-white/10">
          <div className="w-9 h-9">
            <ThreeShield
              size="sm"
              riskLevel={analysis.riskLevel}
              interactive={false}
            />
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-400 uppercase font-mono block">Threat Level</span>
            <span
              className={`text-xs font-bold uppercase ${
                analysis.riskLevel === 'scam'
                  ? 'text-red-400'
                  : analysis.riskLevel === 'caution'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {analysis.riskLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout (Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Original Content Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#22C55E]" />
                <h3 className="text-sm font-bold text-white">Original Forwarded Message</h3>
              </div>
              <span className="text-[11px] text-gray-400 font-mono">{message.timestamp}</span>
            </div>

            {/* Sender Member Banner */}
            {senderMember && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0B0F14] border border-white/10">
                <img
                  src={senderMember.avatarUrl}
                  alt={senderMember.name}
                  className="w-9 h-9 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white">
                    Received by {senderMember.name}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Relationship: <span className="text-[#5B8FFF] font-medium">{senderMember.relation}</span>
                  </div>
                </div>
              </div>
            )}

            {/* WhatsApp Styled Chat Bubble */}
            <div className="relative p-4 rounded-2xl bg-[#0e271f] border border-[#1f513f] text-white space-y-2 shadow-inner">
              <div className="flex items-center justify-between text-[10px] text-emerald-300/80 font-mono pb-1 border-b border-emerald-500/20">
                <span>WhatsApp Incoming</span>
                <span>{message.senderContact}</span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed font-sans whitespace-pre-wrap">
                {message.originalText}
              </p>
              <div className="text-right text-[10px] text-emerald-400/70 font-mono">
                Forwarded • 10:14 AM
              </div>
            </div>

            {/* Screenshot Zoomable Preview (if exists) */}
            {message.screenshotUrl && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">Attached Screenshot</label>
                <div className="relative rounded-xl overflow-hidden border border-white/10 group bg-black/40">
                  <img
                    src={message.screenshotUrl}
                    alt="Scam Proof"
                    className="w-full max-h-60 object-contain rounded-xl"
                  />
                  <a
                    href={message.screenshotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-semibold transition gap-1.5"
                  >
                    <span>Click to Expand Full Resolution</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Link Preview Card (if URL exists) */}
            {message.linkUrl && (
              <div className="p-3.5 rounded-xl bg-[#0B0F14] border border-red-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Malicious URL Flagged</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                    Blacklisted
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 font-mono text-xs text-red-300 break-all select-all border border-red-500/20">
                  {message.linkUrl}
                </div>
                <p className="text-[11px] text-gray-400">
                  ⚠️ Never click this link. It attempts to mimic your bank login page to harvest OTPs.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Risk Score Gauge, Explanations, Family Broadcast */}
        <div className="lg:col-span-7 space-y-4">
          {/* Risk Score Gauge & Status */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
              <RiskScoreGauge
                score={analysis.riskScore}
                riskLevel={analysis.riskLevel}
              />

              {/* Feedback Actions */}
              <div className="w-full sm:w-auto flex flex-col items-center sm:items-start gap-2.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Community Verification
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleFeedback('confirmed_scam')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                      currentFeedback === 'confirmed_scam'
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                        : 'bg-[#121821] text-gray-300 border border-white/10 hover:bg-red-500/20 hover:text-red-300'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Scam</span>
                  </button>

                  <button
                    onClick={() => handleFeedback('marked_safe')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                      currentFeedback === 'marked_safe'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-[#121821] text-gray-300 border border-white/10 hover:bg-emerald-500/20 hover:text-emerald-300'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Mark as Safe</span>
                  </button>

                  <button
                    onClick={() => handleFeedback('not_sure')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                      currentFeedback === 'not_sure'
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                        : 'bg-[#121821] text-gray-300 border border-white/10 hover:bg-amber-500/20 hover:text-amber-300'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Not Sure</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Plain Language "Why this is risky" */}
            <div className="pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#5B8FFF]" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Why This Is Risky (Plain Language AI Breakdown)
                </h3>
              </div>

              <div className="space-y-3">
                {(analysis.plainLanguageExplanation ?? analysis.explanationBullets ?? []).map((point, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-[#0B0F14] border border-white/5 flex items-start gap-3"
                  >
                    <div className="mt-0.5 p-1 rounded-lg bg-red-500/10 text-red-400 flex-shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs text-gray-200 leading-relaxed">
                      {point}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actionable Advice */}
              <div className="p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 space-y-1">
                <div className="text-xs font-bold text-[#22C55E] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Recommended Action for Family:</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed pl-5">
                  {analysis.actionableAdvice ?? analysis.safeActionAdvice?.[0] ?? 'Follow the recommended advice above.'}
                </p>
              </div>
            </div>
          </div>

          {/* Family Impact & 1-Click Alert Broadcast Panel */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-[#EF4444]" />
                <h3 className="text-sm font-bold text-white">Family Defense Action</h3>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                Pattern: {analysis.scamType}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#121821] border border-white/10 text-xs text-gray-300 space-y-1">
              <p className="font-semibold text-white">
                ⚠️ Similar threat pattern active in your area.
              </p>
              <p className="text-gray-400 leading-relaxed">
                Fraudsters frequently target spouses and siblings with the same pitch once they acquire a family surname or phone series.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-gray-400">
                Instantly notify everyone in the <strong>Sharma Family</strong> WhatsApp circle.
              </div>

              <button
                onClick={handleAlertFamily}
                disabled={broadcastSent}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 ${
                  broadcastSent
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-500/25'
                }`}
              >
                {broadcastSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Alert Sent to All 5 Members!</span>
                  </>
                ) : (
                  <>
                    <BellRing className="w-4 h-4" />
                    <span>Alert Family Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
