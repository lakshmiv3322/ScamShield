import React, { useState } from 'react';
import {
  Bell,
  Lock,
  Check,
  Save,
  MessageCircle,
  Trash2,
  Send,
  Loader2,
  Mail,
} from 'lucide-react';
import { Family, User } from '../types';
import { subscribeUserToPush, sendTestPushNotification, isPushSupported } from '../utils/pushNotifications';

interface SettingsPageProps {
  family: Family;
  user: User;
  elderMode: boolean;
  onToggleElderMode: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  family,
  elderMode,
}) => {
  const [retentionDays, setRetentionDays] = useState<string>(String(family.retentionDays || 90));
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [subscribingPush, setSubscribingPush] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);
  const [aiFeedbackOptIn, setAiFeedbackOptIn] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSave = async () => {
    try {
      const days = parseInt(retentionDays, 10) || 90;
      await fetch('/api/family/retention', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retentionDays: days }),
      });

      setSavedSuccess(true);
      showToast('Settings & retention policy saved successfully!');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save settings:', e);
      showToast('Failed to save settings to server.');
    }
  };

  const handleEnablePush = async () => {
    setSubscribingPush(true);
    const res = await subscribeUserToPush();
    setSubscribingPush(false);
    if (res.success) {
      setPushEnabled(true);
      showToast('Push notifications successfully enabled on this device!');
    } else {
      showToast(`Push notification setup: ${res.error || 'Failed'}`);
    }
  };

  const handleSendTestPush = async () => {
    setTestingPush(true);
    const res = await sendTestPushNotification();
    setTestingPush(false);
    if (res.success) {
      showToast('Test notification dispatched to your device!');
    } else {
      showToast(`Test push: ${res.error || 'Enable notifications first'}`);
    }
  };

  const handleManualCleanup = async () => {
    setCleaningUp(true);
    try {
      const res = await fetch('/api/family/cleanup', { method: 'POST' });
      const data = await res.json();
      setCleanupResult(`Pruned ${data.deletedMessages || 0} old messages and ${data.deletedAlerts || 0} alerts.`);
      showToast(`Retention sweep: Removed ${data.deletedMessages || 0} expired records.`);
    } catch (err) {
      setCleanupResult('Cleanup failed. Check server logs.');
    } finally {
      setCleaningUp(false);
    }
  };

  return (
    <div className={`space-y-6 pb-20 max-w-4xl ${elderMode ? 'elder-mode' : ''}`}>
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-[#121821] border border-[#5B8FFF]/40 text-white text-xs shadow-2xl shadow-blue-500/20 flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Security & Circle Settings
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Configure privacy boundaries, push alerts, Resend email fallback, and retention policies.
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
                <h3 className="text-sm font-bold text-white">WhatsApp AI Ingestion & Auto-Reply</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  ACTIVE WEBHOOK
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Webhook Endpoint: <strong className="text-gray-200 font-mono">/api/webhooks/whatsapp</strong>
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-300">
          Connected family members can forward any suspicious SMS, payment request, or bill image directly on WhatsApp to get an instant verdict and alert the circle.
        </p>
      </div>

      {/* Alert Delivery Channels & Web Push Notifications */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
          <Bell className="w-4 h-4 text-[#5B8FFF]" />
          <h3 className="text-sm font-bold text-white">Real-Time Push & Email Fallback</h3>
        </div>

        <div className="space-y-3">
          {/* Web Push */}
          <div className="p-4 rounded-xl bg-[#0B0F14] border border-white/10 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">PWA Mobile & Desktop Web Push</span>
                  {pushEnabled && (
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  VAPID-authenticated emergency push notifications dispatched directly to Android, iOS, or desktop screens whenever a scam is detected.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={subscribingPush || !isPushSupported()}
                  onClick={handleEnablePush}
                  className="px-3 py-1.5 rounded-xl bg-[#5B8FFF] hover:bg-blue-600 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {subscribingPush ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                  <span>{pushEnabled ? 'Subscribed' : 'Enable Push'}</span>
                </button>

                <button
                  type="button"
                  disabled={testingPush}
                  onClick={handleSendTestPush}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {testingPush ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  <span>Test Push</span>
                </button>
              </div>
            </div>
          </div>

          {/* Email Fallback Card */}
          <div className="p-4 rounded-xl bg-[#0B0F14] border border-white/10 space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white">Resend Email Fallback Engine</span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              When family members have not enabled browser push on their phone, high-risk scam alerts are automatically routed via Resend Email fallback.
            </p>
          </div>

          {/* WhatsApp toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B0F14] border border-white/5">
            <div>
              <div className="text-xs font-semibold text-white">WhatsApp Cross-Family Broadcast</div>
              <div className="text-[11px] text-gray-400">
                Broadcast emergency alerts to connected family members when severe threats occur.
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
        </div>
      </div>

      {/* Privacy & Data Retention */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
          <Lock className="w-4 h-4 text-[#5B8FFF]" />
          <h3 className="text-sm font-bold text-white">Data Retention Policy</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Message History Retention Window
            </label>
            <p className="text-[11px] text-gray-400 mb-2.5">
              Messages, screenshots, and alert records older than this window are automatically purged by the nightly cleanup job.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: '30', label: '30 Days', desc: 'Strict Privacy' },
                { id: '60', label: '60 Days', desc: '2 Months' },
                { id: '90', label: '90 Days', desc: 'Default (Quarterly)' },
                { id: '180', label: '180 Days', desc: 'Semi-annual' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRetentionDays(opt.id)}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    retentionDays === opt.id
                      ? 'bg-[#5B8FFF]/20 border-[#5B8FFF] text-white shadow-lg shadow-blue-500/10'
                      : 'bg-[#0B0F14] border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <div className="font-bold">{opt.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B0F14] border border-white/5">
            <div>
              <div className="text-xs font-semibold text-white">Manual Retention Sweep</div>
              <div className="text-[11px] text-gray-400">
                Immediately trigger the cleanup routine to purge data older than {retentionDays} days.
              </div>
              {cleanupResult && (
                <div className="text-[11px] text-emerald-400 mt-1 font-mono">
                  {cleanupResult}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={cleaningUp}
              onClick={handleManualCleanup}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {cleaningUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-gray-400" />}
              <span>{cleaningUp ? 'Sweeping...' : 'Purge Old Data Now'}</span>
            </button>
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

      {/* Danger Zone */}
      <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-3">
        <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
          <Trash2 className="w-4 h-4" />
          <span>Danger Zone</span>
        </div>
        <p className="text-xs text-gray-400">
          Reset local demonstration state or disband the active family circle.
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset local application state?')) {
              window.location.reload();
            }
          }}
          className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-semibold transition"
        >
          Reset Demonstration State
        </button>
      </div>
    </div>
  );
};
