import React, { useState } from 'react';
import {
  Share2,
  Eye,
  Check,
  Plus,
  Flame,
  Copy,
  MessageCircle,
} from 'lucide-react';
import { Family, FamilyMember } from '../types';

interface FamilyPageProps {
  family: Family;
  members: FamilyMember[];
  elderMode: boolean;
  onToggleElderMode: () => void;
  onOpenInviteModal: () => void;
  onUpdateMemberAlerts: (memberId: string, enabled: boolean) => void;
}

export const FamilyPage: React.FC<FamilyPageProps> = ({
  family,
  members,
  elderMode,
  onToggleElderMode,
  onOpenInviteModal,
  onUpdateMemberAlerts,
}) => {
  const [copied, setCopied] = useState(false);
  const inviteLink = `${window.location.origin}/join/${family.code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className={`space-y-6 pb-20 ${elderMode ? 'elder-mode' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Family Circle Management
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#5B8FFF]/20 text-[#5B8FFF] font-mono">
              {family.code}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Manage who is protected under <strong>{family.name}</strong> and configure instant alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenInviteModal}
            className="px-4 py-2 rounded-xl bg-[#5B8FFF] hover:bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* Elder Mode Dedicated Highlight Card */}
      <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Elder Mode Interface</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${elderMode ? 'bg-amber-500 text-black' : 'bg-white/10 text-gray-400'}`}>
                {elderMode ? 'CURRENTLY ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-0.5 max-w-xl">
              Increases typography to 18px+, maximizes color contrast, simplifies navigation, and reduces clutter for parents and grandparents.
            </p>
          </div>
        </div>

        <button
          onClick={onToggleElderMode}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition whitespace-nowrap shadow-md ${
            elderMode
              ? 'bg-amber-500 hover:bg-amber-400 text-black'
              : 'bg-[#121821] hover:bg-white/10 text-white border border-white/15'
          }`}
        >
          {elderMode ? 'Disable Elder Mode' : 'Preview Elder Mode'}
        </button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((member) => {
          const isHighTarget = member.threatStatus === 'high_target';
          return (
            <div
              key={member.id}
              className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-white/20 transition space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-white/10"
                    />
                    {isHighTarget && (
                      <div
                        title="High fraud target"
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]"
                      >
                        <Flame className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{member.name}</h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-gray-300 capitalize">
                        {member.role}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Relationship: <span className="text-white font-medium">{member.relation}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                      {member.phone}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isHighTarget
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : member.threatStatus === 'moderate'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isHighTarget ? 'High Target' : member.threatStatus}
                </span>
              </div>

              {/* Stats & Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs text-gray-300">
                <div className="bg-[#0B0F14] p-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-500 uppercase block font-semibold">
                    Activity
                  </span>
                  <span className="font-mono text-white font-bold text-sm">
                    {member.messagesAnalyzedThisWeek} msgs
                  </span>
                  <span className="text-[10px] text-gray-400 block">scanned this week</span>
                </div>

                <div className="bg-[#0B0F14] p-2.5 rounded-xl border border-white/5 flex flex-col justify-between">
                  <span className="text-[10px] text-gray-500 uppercase block font-semibold">
                    Live Alerts
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      WhatsApp Push
                    </span>
                    <button
                      onClick={() => onUpdateMemberAlerts(member.id, !member.receiveAlerts)}
                      className={`w-8 h-4 rounded-full transition relative ${
                        member.receiveAlerts ? 'bg-emerald-500' : 'bg-gray-700'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white transition transform ${
                          member.receiveAlerts ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite Share Strip */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#5B8FFF]" />
          <span>Quick Share Circle Invite</span>
        </h3>
        <p className="text-xs text-gray-400">
          Share this unique secure invite link with your family members to add them to your AI guard.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            readOnly
            value={inviteLink}
            className="w-full sm:flex-1 px-3 py-2 rounded-xl bg-[#0B0F14] border border-white/10 text-xs text-gray-300 font-mono"
          />
          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#121821] hover:bg-white/10 border border-white/15 text-xs text-white font-semibold flex items-center justify-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Join our family on ScamShield: ${inviteLink}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-black" />
            <span>WhatsApp Invite</span>
          </a>
        </div>
      </div>
    </div>
  );
};
