import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { AlertItem, RiskLevel } from '../types';

interface AlertsPageProps {
  alerts: AlertItem[];
  onSelectAlert: (messageId: string) => void;
  onMarkAllAsRead: () => void;
  elderMode: boolean;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts,
  onSelectAlert,
  onMarkAllAsRead,
  elderMode,
}) => {
  const [filter, setFilter] = useState<'all' | RiskLevel>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = alerts.filter((alert) => {
    if (filter !== 'all' && alert.riskLevel !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        alert.title.toLowerCase().includes(q) ||
        alert.description.toLowerCase().includes(q) ||
        alert.affectedMemberName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className={`space-y-6 pb-20 ${elderMode ? 'elder-mode' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Family Security Alerts
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Real-time feed of detected fraud attempts targeted at your family circle.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="px-3 py-1.5 rounded-xl bg-[#121821] hover:bg-[#1a2330] border border-white/10 text-xs text-gray-300 hover:text-white flex items-center gap-1.5 transition self-start sm:self-auto"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#121821] border border-white/10 w-full sm:w-auto overflow-x-auto">
          {(['all', 'scam', 'caution', 'safe'] as const).map((lvl) => {
            const count = lvl === 'all' ? alerts.length : alerts.filter((a) => a.riskLevel === lvl).length;
            const isActive = filter === lvl;

            return (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#5B8FFF] text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{lvl === 'all' ? 'All Alerts' : lvl}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by keyword or family member..."
          className="w-full sm:w-64 px-3 py-2 rounded-xl bg-[#121821] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#5B8FFF] transition"
        />
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center glass-panel rounded-2xl border border-white/10 text-gray-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-sm font-bold text-white">No alerts found</div>
            <p className="text-xs">Your family circle is currently safe with no flagged threats.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isScam = alert.riskLevel === 'scam';
            const isCaution = alert.riskLevel === 'caution';

            return (
              <div
                key={alert.id}
                onClick={() => onSelectAlert(alert.messageId)}
                className={`p-4 sm:p-5 rounded-2xl border transition duration-200 cursor-pointer group ${
                  !alert.isRead
                    ? 'bg-[#121821] border-[#5B8FFF]/40 shadow-lg shadow-blue-500/5'
                    : 'glass-panel hover:bg-[#121821] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
                        isScam
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : isCaution
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isScam ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : isCaution ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <ShieldCheck className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white group-hover:text-[#5B8FFF] transition truncate">
                          {alert.title}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                            isScam
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : isCaution
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {alert.riskLevel}
                        </span>
                        {!alert.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#5B8FFF] animate-pulse" />
                        )}
                      </div>

                      <p className="text-xs text-gray-300 leading-relaxed mb-2.5 line-clamp-2">
                        {alert.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400">
                        <span>
                          Target: <strong className="text-white">{alert.affectedMemberName}</strong> ({alert.affectedMemberRelation})
                        </span>
                        <span>•</span>
                        <span className="font-mono text-gray-500">{alert.scamType}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {alert.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-[#5B8FFF] font-semibold self-center group-hover:translate-x-1 transition flex-shrink-0">
                    <span className="hidden sm:inline">Analyze</span>
                    <ChevronRight className="w-4 h-4" />
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
