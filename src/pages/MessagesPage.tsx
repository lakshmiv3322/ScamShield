import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  ChevronRight,
  Clock,
  Link as LinkIcon,
  Image as ImageIcon,
} from 'lucide-react';
import { MessageItem, FamilyMember, RiskLevel } from '../types';

interface MessagesPageProps {
  messages: MessageItem[];
  members: FamilyMember[];
  onSelectMessage: (messageId: string) => void;
  onOpenForwardModal: () => void;
  elderMode: boolean;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  messages,
  members,
  onSelectMessage,
  onOpenForwardModal,
  elderMode,
}) => {
  const [filter, setFilter] = useState<'all' | RiskLevel>('all');
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<string>('all');

  const filteredMessages = messages.filter((msg) => {
    if (filter !== 'all' && msg.analysis?.riskLevel !== filter) return false;
    if (selectedMember !== 'all' && msg.senderMemberId !== selectedMember) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (msg.originalText?.toLowerCase().includes(q) ?? false) ||
        (msg.content?.text?.toLowerCase().includes(q) ?? false) ||
        (msg.analysis?.scamType?.toLowerCase().includes(q) ?? false) ||
        (msg.linkUrl && msg.linkUrl.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getMember = (id: string) => members.find((m) => m.id === id);

  return (
    <div className={`space-y-6 pb-20 ${elderMode ? 'elder-mode' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Forwarded Ingested Messages
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Full repository of WhatsApp forwards, links, and screenshots evaluated by ScamShield AI.
          </p>
        </div>

        <button
          onClick={onOpenForwardModal}
          className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95 self-start sm:self-auto"
        >
          <Send className="w-3.5 h-3.5 fill-black" />
          <span>Forward New Message</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Risk Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#121821] border border-white/10 text-xs">
            {(['all', 'scam', 'caution', 'safe'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition ${
                  filter === lvl
                    ? 'bg-[#5B8FFF] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Member Filter Dropdown */}
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#121821] border border-white/10 text-xs text-gray-200 focus:outline-none focus:border-[#5B8FFF]"
          >
            <option value="all">All Members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.relation})
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search message text or links..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121821] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#5B8FFF] transition"
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="p-12 text-center glass-panel rounded-2xl border border-white/10 text-gray-400 space-y-2">
            <MessageSquare className="w-8 h-8 text-gray-500 mx-auto" />
            <div className="text-sm font-bold text-white">No messages found</div>
            <p className="text-xs">Try clearing your filters or forward a message to test analysis.</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const member = getMember(msg.senderMemberId);
            const isScam = msg.analysis?.riskLevel === 'scam';
            const isCaution = msg.analysis?.riskLevel === 'caution';

            return (
              <div
                key={msg.id}
                onClick={() => onSelectMessage(msg.id)}
                className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-[#5B8FFF]/40 transition duration-150 cursor-pointer group space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {member && (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                    )}
                    <span className="text-xs font-bold text-white">
                      {member ? `${member.name} (${member.relation})` : msg.senderContact}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {msg.timestamp}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        isScam
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : isCaution
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {msg.analysis?.riskLevel ?? 'pending'} • {msg.analysis?.riskScore ?? '—'}/100
                    </span>
                    <span className="text-xs font-mono text-gray-500 hidden sm:inline">
                      {msg.analysis?.scamType}
                    </span>
                  </div>
                </div>

                {/* Message Body Excerpt */}
                <div className="p-3 rounded-xl bg-[#0B0F14]/80 border border-white/5 text-xs text-gray-200 line-clamp-2 leading-relaxed">
                  "{msg.originalText ?? msg.content?.text ?? ''}"
                </div>

                {/* Bottom Row info & badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-gray-400">
                  <div className="flex items-center gap-3">
                    {msg.linkUrl && (
                      <span className="flex items-center gap-1 text-red-400 font-mono">
                        <LinkIcon className="w-3 h-3" />
                        Flagged Link
                      </span>
                    )}
                    {msg.screenshotUrl && (
                      <span className="flex items-center gap-1 text-[#5B8FFF]">
                        <ImageIcon className="w-3 h-3" />
                        Screenshot Analyzed
                      </span>
                    )}
                    {msg.userFeedback && (
                      <span className="text-emerald-400 font-medium capitalize">
                        Feedback: {msg.userFeedback.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-[#5B8FFF] font-semibold group-hover:translate-x-1 transition">
                    <span>Inspect Verdict</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
