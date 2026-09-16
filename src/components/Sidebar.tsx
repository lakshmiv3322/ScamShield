import React from 'react';
import {
  LayoutDashboard,
  Bell,
  MessageSquare,
  Users,
  Settings,
  Send,
  Zap,
} from 'lucide-react';
import { AlertItem } from '../types';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  alerts: AlertItem[];
  onOpenForwardModal: () => void;
  onTriggerDemoScam: () => void;
  isInjectingScam?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  alerts,
  onOpenForwardModal,
  onTriggerDemoScam,
  isInjectingScam = false,
}) => {
  const unreadAlerts = alerts.filter((a) => !a.isRead).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: unreadAlerts > 0 ? unreadAlerts : null },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: null },
    { id: 'family', label: 'Family Circle', icon: Users, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ];

  return (
    <>
      {/* Desktop / Tablet Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0B0F14] border-r border-white/10 p-4 min-h-[calc(100vh-61px)] flex-shrink-0">
        {/* Navigation Items */}
        <div className="space-y-1.5 flex-1">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-[#5B8FFF] text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-300 hover:bg-[#121821] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white text-blue-600' : 'bg-[#EF4444] text-white animate-pulse'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Forward Button (Simulates WhatsApp Forward) */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          <button
            onClick={onOpenForwardModal}
            className="w-full py-2.5 px-3 rounded-xl bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] border border-[#22C55E]/30 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Forward to AI</span>
          </button>

          {/* Hackathon Jury Instant Trigger */}
          <button
            onClick={onTriggerDemoScam}
            disabled={isInjectingScam}
            className={`w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600/25 to-amber-600/25 hover:from-red-600/35 hover:to-amber-600/35 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98 ${
              isInjectingScam ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            title="Inject a fresh scam message to demonstrate live radar alerting"
          >
            <Zap className={`w-3.5 h-3.5 text-red-400 ${isInjectingScam ? 'animate-spin' : ''}`} />
            <span>{isInjectingScam ? 'Simulating...' : 'Test Scam Demo'}</span>
          </button>
        </div>

        {/* Status card */}
        <div className="mt-4 p-3 rounded-xl bg-[#121821] border border-white/10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-gray-200">AI Guard Active</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            WhatsApp bridge connected to Sharma Family circle.
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F14]/95 backdrop-blur-xl border-t border-white/10 px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-medium transition ${
                isActive ? 'text-[#5B8FFF]' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge !== null && (
                <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-[#EF4444]" />
              )}
            </button>
          );
        })}
        {/* Floating Add on Mobile */}
        <button
          onClick={onOpenForwardModal}
          className="flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-medium text-emerald-400"
        >
          <Send className="w-5 h-5" />
          <span>Forward</span>
        </button>
      </nav>
    </>
  );
};
