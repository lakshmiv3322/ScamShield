import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  MessageSquare,
  Users,
  TrendingUp,
  Zap,
  Share2,
  AlertTriangle,
  ArrowRight,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Flame,
} from 'lucide-react';
import {
  Family,
  FamilyMember,
  MessageItem,
  AlertItem,
  MapRiskPin,
  DashboardStats,
} from '../types';
import { ThreeRiskMap } from '../components/ThreeRiskMap';

interface DashboardPageProps {
  family: Family;
  members: FamilyMember[];
  messages: MessageItem[];
  alerts: AlertItem[];
  pins: MapRiskPin[];
  stats: DashboardStats;
  elderMode: boolean;
  onNavigateMessage: (messageId: string) => void;
  onNavigateAlerts: () => void;
  onNavigateFamily: () => void;
  onTriggerDemoScam: () => void;
  onOpenForwardModal: () => void;
  onOpenInviteModal: () => void;
  isInjectingScam?: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  family,
  members,
  messages,
  alerts,
  pins,
  stats,
  elderMode,
  onNavigateMessage,
  onNavigateAlerts,
  onNavigateFamily,
  onTriggerDemoScam,
  onOpenForwardModal,
  onOpenInviteModal,
  isInjectingScam = false,
}) => {
  // Count-up animations for header stats
  const [animatedScams, setAnimatedScams] = useState(0);
  const [animatedMessages, setAnimatedMessages] = useState(0);
  const [animatedMembers, setAnimatedMembers] = useState(0);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  useEffect(() => {
    let startTime = performance.now();
    const duration = 1200;

    const frame = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScams(Math.round(eased * stats.scamsDetectedCount));
      setAnimatedMessages(Math.round(eased * stats.messagesAnalyzedCount));
      setAnimatedMembers(Math.round(eased * stats.familyMembersProtectedCount));

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
  }, [stats]);

  return (
    <div className={`space-y-6 pb-16 ${elderMode ? 'elder-mode' : ''}`}>
      {/* Top Banner & Quick Actions Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Family Fraud Radar
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Shielding
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Real-time protection & threat intelligence for the <strong>{family.name}</strong> circle.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Hackathon Jury Core Button: Test Scam Demo */}
          <button
            onClick={onTriggerDemoScam}
            disabled={isInjectingScam}
            className={`px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-500/25 flex items-center gap-2 transition active:scale-95 ${
              isInjectingScam ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            title="Inject a real-time scam alert to test live map and radar response"
          >
            <Zap className={`w-4 h-4 ${isInjectingScam ? 'animate-spin' : ''}`} />
            <span>{isInjectingScam ? 'Injecting Scam...' : 'Test Scam Demo'}</span>
          </button>

          <button
            onClick={onOpenForwardModal}
            className="px-3.5 py-2 rounded-xl bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] border border-[#22C55E]/30 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Forward Message</span>
          </button>

          <button
            onClick={onOpenInviteModal}
            className="px-3 py-2 rounded-xl bg-[#121821] hover:bg-[#1a2330] border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5 text-[#5B8FFF]" />
            <span>Invite</span>
          </button>
        </div>
      </div>

      {/* Header Stats Row (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Scams Detected */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-red-500/40 transition duration-200 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full group-hover:bg-red-500/10 transition" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Scams Detected
            </span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 group-hover:scale-110 transition">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
              {animatedScams}
            </span>
            <span className="text-xs font-semibold text-red-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +{stats.scamsTrendWeek} this week
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Blocked before financial or credential theft occurred.
          </p>
        </div>

        {/* Card 2: Messages Analyzed */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-[#5B8FFF]/40 transition duration-200 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#5B8FFF]/5 rounded-bl-full group-hover:bg-[#5B8FFF]/10 transition" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Messages Analyzed
            </span>
            <div className="p-2 rounded-xl bg-[#5B8FFF]/10 text-[#5B8FFF] group-hover:scale-110 transition">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
              {animatedMessages}
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              1.4s avg latency
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            WhatsApp forwards, SMS alerts, and suspicious image scans.
          </p>
        </div>

        {/* Card 3: Family Members Protected */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-emerald-500/40 transition duration-200 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Protected Circle
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
              {animatedMembers}
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              100% active
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Parents, grandparents & siblings covered under one umbrella.
          </p>
        </div>
      </div>

      {/* Main Grid: 3D Live Risk Map + Right Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center 7 cols: 3D Live Risk Map */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Live Threat Geospatial Radar
              </h2>
              <span className="text-[10px] font-mono text-gray-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                Interactive 3D
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {pins.length} scam origin clusters tracked
            </span>
          </div>

          <ThreeRiskMap pins={pins} />
        </div>

        {/* Right 5 cols: Family Members Panel */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">
              Family Risk Profile
            </h2>
            <button
              onClick={onNavigateFamily}
              className="text-xs text-[#5B8FFF] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Manage Circle</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-white/10 space-y-3">
            {members.map((member) => {
              const isHighTarget = member.threatStatus === 'high_target';
              return (
                <div
                  key={member.id}
                  onClick={onNavigateFamily}
                  className="p-3 rounded-xl bg-[#0B0F14]/70 hover:bg-[#1a2330] border border-white/5 hover:border-white/15 transition cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      {isHighTarget && (
                        <div
                          title="Most targeted by financial fraudsters"
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] shadow"
                        >
                          <Flame className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{member.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-gray-300">
                          {member.relation}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isHighTarget
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : member.threatStatus === 'moderate'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isHighTarget ? 'Most Targeted' : member.threatStatus}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {member.messagesAnalyzedThisWeek} msgs/wk
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Volume Activity bar */}
                  <div className="w-16 hidden sm:block">
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isHighTarget ? 'bg-red-500' : 'bg-[#5B8FFF]'
                        }`}
                        style={{ width: `${Math.min(member.messagesAnalyzedThisWeek * 5, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="pt-2">
              <button
                onClick={onOpenInviteModal}
                className="w-full py-2.5 rounded-xl border border-dashed border-white/20 hover:border-[#5B8FFF] text-xs text-gray-400 hover:text-white font-medium flex items-center justify-center gap-2 transition"
              >
                <Share2 className="w-3.5 h-3.5 text-[#5B8FFF]" />
                <span>+ Invite Grandparent or Child</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts Timeline Section */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Recent Scam & Caution Alerts
            </h2>
            <p className="text-xs text-gray-400">
              Click any incident to inspect full plain-language breakdown
            </p>
          </div>
          <button
            onClick={onNavigateAlerts}
            className="text-xs text-[#5B8FFF] hover:underline font-semibold flex items-center gap-1"
          >
            <span>View All ({alerts.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3">
          {alerts.slice(0, 4).map((alert, index) => {
            const isScam = alert.riskLevel === 'scam';
            const isExpanded = expandedAlertId === alert.id;

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition duration-150 ${
                  isScam
                    ? 'bg-[#121821] hover:bg-[#1a2330] border-red-500/20 hover:border-red-500/40'
                    : 'bg-[#121821] hover:bg-[#1a2330] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    {/* Status Dot */}
                    <div className="mt-1 flex-shrink-0">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          isScam ? 'bg-[#EF4444] shadow-md shadow-red-500/50' : 'bg-[#F59E0B]'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white">
                          {alert.title}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                            isScam
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {alert.scamType}
                        </span>
                      </div>

                      <p className="text-xs text-gray-300 mt-1 line-clamp-1">
                        {alert.description}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
                        <span>Target: <strong className="text-white">{alert.affectedMemberName} ({alert.affectedMemberRelation})</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* View Details Action */}
                  <div className="flex items-center gap-2 self-end sm:self-center mt-2 sm:mt-0">
                    <button
                      onClick={() => onNavigateMessage(alert.messageId)}
                      className="px-3 py-1.5 rounded-xl bg-[#5B8FFF]/15 hover:bg-[#5B8FFF]/25 text-[#5B8FFF] border border-[#5B8FFF]/30 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <span>Analyze</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
