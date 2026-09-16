import React, { useState } from 'react';
import { Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installedNotification, setInstalledNotification] = useState(false);

  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
        <Check className="w-3.5 h-3.5" />
        <span>PWA Installed</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstalledNotification(true);
        setTimeout(() => setInstalledNotification(false), 4000);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Fallback for browsers that don't trigger beforeinstallprompt directly in iframe
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#5B8FFF] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-md shadow-blue-500/20 transition active:scale-95 ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-xs sm:text-sm'
        }`}
        title="Install ScamShield PWA for one-tap WhatsApp scam protection"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>{compact ? 'Install PWA' : 'Install ScamShield'}</span>
      </button>

      {/* iOS & Browser Install Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-[#121821] border border-white/15 p-6 shadow-2xl">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-[#5B8FFF]/10 border border-[#5B8FFF]/30 text-[#5B8FFF]">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Install ScamShield PWA</h3>
                <p className="text-xs text-gray-400">Get 1-tap alerts & WhatsApp forwarding on your home screen</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-gray-300 bg-[#0B0F14]/70 p-4 rounded-xl border border-white/10">
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#5B8FFF]/20 text-[#5B8FFF] font-bold flex items-center justify-center text-[11px]">
                  1
                </span>
                <p>On iPhone: Tap the <strong>Share button</strong> in Safari toolbar.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#5B8FFF]/20 text-[#5B8FFF] font-bold flex items-center justify-center text-[11px]">
                  2
                </span>
                <p>Scroll down and tap <strong>"Add to Home Screen"</strong>.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#5B8FFF]/20 text-[#5B8FFF] font-bold flex items-center justify-center text-[11px]">
                  3
                </span>
                <p>On Android/Chrome: Tap <strong>"Install"</strong> or menu (⋮) → <strong>Add to Home screen</strong>.</p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#5B8FFF] hover:bg-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
