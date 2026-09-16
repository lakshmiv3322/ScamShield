import React, { useState } from 'react';
import {
  Bell,
  Lock,
  Check,
  Save,
  MessageCircle,
  Trash2,
} from 'lucide-react';
import { Family, User } from '../types';

interface SettingsPageProps {
  family: Family;
  user: User;
  elderMode: boolean;
  onToggleElderMode: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  family,
  user,
  elderMode,
  onToggleElderMode,
}) => {
  const [retentionDays, setRetentionDays] = useState<'30' | '90' | 'forever'>('30');
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [aiFeedbackOptIn, setAiFeedbackOptIn] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className={`space-y-6 pb-20 max-w-4xl ${elderMode ? 'elder-mode' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Security & Circle Settings
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Configure privacy boundaries, notifications, and AI detection preferences.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-[#5B8FFF] hover:bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center gap-1.5 transition active:scale-95"
        >
          {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span>{savedSuccess ? 'Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      {/* WhatsApp Bridge Connected Status */}
      <div className="glass-panel p-5 rounded-2xl border border-[#22C55E]/30 bg-gradient-to-r from-emerald-500/5 to-transparent space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#22C55E]/15 text-[#22C55E]">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">WhatsApp AI Bridge Status</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  CONNECTED
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Connected Number: <strong className="text-gray-200">+91 98201 55220</strong> (ScamShield Bot)
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-300">
          Family members can forward any message or contact card directly to this WhatsApp contact to trigger an automated instant scan.
        </p>
      </div>

      {/* Privacy & Data Retention */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
          <Lock className="w-4 h-4 text-[#5B8FFF]" />
          <h3 className="text-sm font-bold text-white">Privacy & Retention Controls</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Data Retention Period
            </label>
            <p className="text-[11px] text-gray-400 mb-2">
              How long forwarded messages & threat evidence are retained in your circle’s history.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '30', label: '30 Days', desc: 'Auto-delete after 1 month (Recommended)' },
                { id: '90', label: '90 Days', desc: 'Quarterly review window' },
                { id: 'forever', label: 'Forever', desc: 'Keep indefinite family history' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRetentionDays(opt.id as any)}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    retentionDays === opt.id
                      ? 'bg-[#5B8FFF]/20 border-[#5B8FFF] text-white'
                      : 'bg-[#0B0F14] border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <div className="font-bold">{opt.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Model Feedback */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B0F14] border border-white/5">
            <div>
              <div className="text-xs font-semibold text-white">Anonymized Threat Intelligence</div>
              <div className="text-[11px] text-gray-400">
                Share stripped scam URLs to help protect other families globally.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAiFeedbackOptIn(!aiFeedbackOptIn)}
              className={`w-9 h-5 rounded-full transition relative ${
                aiFeedbackOptIn ? 'bg-[#5B8FFF]' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition transform ${
                  aiFeedbackOptIn ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Configuration */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
          <Bell className="w-4 h-4 text-[#5B8FFF]" />
          <h3 className="text-sm font-bold text-white">Alert Delivery Channels</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F14] border border-white/5">
            <div>
              <div className="text-xs font-semibold text-white">WhatsApp Emergency Alerts</div>
              <div className="text-[11px] text-gray-400">
                Immediately message all family guardians when high-risk scam is detected.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWhatsappNotifications(!whatsappNotifications)}
              className={`w-9 h-5 rounded-full transition relative ${
                whatsappNotifications ? 'bg-emerald-500' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition transform ${
                  whatsappNotifications ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F14] border border-white/5">
            <div>
              <div className="text-xs font-semibold text-white">PWA Mobile Push Notifications</div>
              <div className="text-[11px] text-gray-400">
                Sound and banner alert on iPhone, Android, or desktop screen.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPushNotifications(!pushNotifications)}
              className={`w-9 h-5 rounded-full transition relative ${
                pushNotifications ? 'bg-emerald-500' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition transform ${
                  pushNotifications ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-3">
        <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
          <Trash2 className="w-4 h-4" />
          <span>Danger Zone</span>
        </div>
        <p className="text-xs text-gray-400">
          Reset all demo messages, clear history, or disband the current family circle.
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset all demo messages and radar pins back to pristine defaults?')) {
              window.location.reload();
            }
          }}
          className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-semibold transition"
        >
          Reset Demo Data
        </button>
      </div>
    </div>
  );
};
