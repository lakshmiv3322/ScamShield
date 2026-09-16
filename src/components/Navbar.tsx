import React, { useState } from 'react';
import { Shield, Bell, Eye, LogOut, ChevronDown, Check, User as UserIcon } from 'lucide-react';
import { User, Family, AlertItem } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  user: User;
  family: Family;
  alerts: AlertItem[];
  elderMode: boolean;
  onToggleElderMode: () => void;
  onNavigate: (page: string) => void;
  onOpenAlerts: () => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  family,
  alerts,
  elderMode,
  onToggleElderMode,
  onNavigate,
  onOpenAlerts,
  currentPage,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [familyDropdownOpen, setFamilyDropdownOpen] = useState(false);

  const unreadAlertsCount = alerts.filter((a) => !a.isRead).length;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0F14]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Click to Home/Dashboard */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#5B8FFF] to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition">
              <Shield className="w-5 h-5 text-white" />
              <div className="absolute -inset-0.5 rounded-xl bg-[#5B8FFF] opacity-20 blur-sm group-hover:opacity-50 transition" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-white tracking-tight">ScamShield</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#5B8FFF]/20 text-[#5B8FFF] border border-[#5B8FFF]/30 font-mono">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium hidden sm:block">
                Family Fraud Copilot
              </p>
            </div>
          </button>

          {/* Center/Left: Family Circle Selector Dropdown */}
          <div className="relative ml-2 sm:ml-4">
            <button
              onClick={() => setFamilyDropdownOpen(!familyDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121821] hover:bg-[#1a2330] border border-white/10 text-xs text-gray-200 transition"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-white max-w-[120px] truncate">{family.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {familyDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-[#121821] border border-white/15 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] text-gray-400 px-2.5 py-1 uppercase tracking-wider font-semibold">
                  Active Circle
                </div>
                <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-[#5B8FFF]/10 border border-[#5B8FFF]/25 text-xs text-white">
                  <div className="font-medium">{family.name}</div>
                  <Check className="w-3.5 h-3.5 text-[#5B8FFF]" />
                </div>
                <div className="mt-1 pt-1 border-t border-white/10">
                  <button
                    onClick={() => {
                      setFamilyDropdownOpen(false);
                      onNavigate('family');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-white/5 hover:text-white transition"
                  >
                    Manage Circle & Invites
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions, Elder Mode, PWA Install, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Elder Mode Toggle */}
          <button
            onClick={onToggleElderMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              elderMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
                : 'bg-[#121821] text-gray-300 border-white/10 hover:bg-white/5'
            }`}
            title="Toggle Elder Mode: Larger fonts, higher contrast, and simplified view"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Elder Mode</span>
            <span className={`text-[10px] px-1 rounded ${elderMode ? 'bg-amber-500 text-black font-bold' : 'bg-white/10 text-gray-400'}`}>
              {elderMode ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton compact />

          {/* Notification Bell with Badge */}
          <button
            onClick={onOpenAlerts}
            className="relative p-2 rounded-xl bg-[#121821] hover:bg-[#1a2330] border border-white/10 text-gray-300 hover:text-white transition"
            title="View Real-Time Scam Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl bg-[#121821] hover:bg-[#1a2330] border border-white/10 transition"
            >
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="w-7 h-7 rounded-lg object-cover"
              />
              <span className="text-xs font-medium text-gray-200 hidden md:inline">
                {user.name}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400 hidden md:inline" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#121821] border border-white/15 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <p className="text-xs font-bold text-white">{user.name}</p>
                  <p className="text-[11px] text-gray-400 capitalize">{user.role} • {family.name}</p>
                </div>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onNavigate('settings');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition"
                >
                  <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                  Account & Settings
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onNavigate('landing');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Exit to Landing
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
