import React, { useState } from 'react';
import { X, Copy, Check, Share2, QrCode, MessageCircle } from 'lucide-react';
import { Family } from '../types';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  family: Family;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, family }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const inviteLink = `${window.location.origin}/join/${family.code}`;
  const whatsappShareText = encodeURIComponent(
    `🛡️ Join our ${family.name} circle on ScamShield! Whenever you get a suspicious WhatsApp message, link, or call, forward it to our AI guard to protect our family: ${inviteLink}`
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-[#121821] border border-white/15 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#5B8FFF]/10 border border-[#5B8FFF]/30 text-[#5B8FFF]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Invite Family Circle</h2>
              <p className="text-xs text-gray-400">Add parents, grandparents, or children</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center p-4 rounded-xl bg-[#0B0F14] border border-white/10 mb-4">
          {/* Stylized QR Code SVG */}
          <div className="p-3 bg-white rounded-xl shadow-lg mb-3">
            <svg
              width="140"
              height="140"
              viewBox="0 0 140 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="140" height="140" fill="white" />
              {/* Top-left corner finder */}
              <rect x="14" y="14" width="35" height="35" rx="4" fill="#0B0F14" />
              <rect x="21" y="21" width="21" height="21" rx="2" fill="white" />
              <rect x="26" y="26" width="11" height="11" fill="#5B8FFF" />
              {/* Top-right corner finder */}
              <rect x="91" y="14" width="35" height="35" rx="4" fill="#0B0F14" />
              <rect x="98" y="21" width="21" height="21" rx="2" fill="white" />
              <rect x="103" y="26" width="11" height="11" fill="#5B8FFF" />
              {/* Bottom-left corner finder */}
              <rect x="14" y="91" width="35" height="35" rx="4" fill="#0B0F14" />
              <rect x="21" y="98" width="21" height="21" rx="2" fill="white" />
              <rect x="26" y="103" width="11" height="11" fill="#5B8FFF" />
              {/* Matrix pattern dots */}
              <rect x="56" y="14" width="7" height="14" fill="#0B0F14" />
              <rect x="70" y="21" width="14" height="7" fill="#0B0F14" />
              <rect x="56" y="35" width="28" height="7" fill="#0B0F14" />
              <rect x="14" y="56" width="14" height="7" fill="#0B0F14" />
              <rect x="35" y="63" width="21" height="14" fill="#0B0F14" />
              <rect x="63" y="56" width="14" height="28" fill="#5B8FFF" />
              <rect x="84" y="56" width="21" height="7" fill="#0B0F14" />
              <rect x="112" y="63" width="14" height="14" fill="#0B0F14" />
              <rect x="56" y="91" width="14" height="14" fill="#0B0F14" />
              <rect x="77" y="98" width="28" height="7" fill="#0B0F14" />
              <rect x="112" y="91" width="14" height="28" fill="#0B0F14" />
              <rect x="70" y="112" width="21" height="14" fill="#5B8FFF" />
            </svg>
          </div>

          <div className="text-center">
            <span className="text-[11px] text-gray-400">Family Circle Invite Code</span>
            <div className="text-sm font-mono font-bold text-[#5B8FFF] tracking-wider mt-0.5">
              {family.code}
            </div>
          </div>
        </div>

        {/* Invite Link field & Copy button */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1">
              Invite Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 px-3 py-2 rounded-xl bg-[#0B0F14] border border-white/10 text-xs text-gray-300 font-mono truncate"
              />
              <button
                onClick={handleCopy}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                  copied
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-[#121821] hover:bg-white/10 text-white border-white/15'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Direct WhatsApp Share button */}
          <a
            href={`https://wa.me/?text=${whatsappShareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-98"
          >
            <MessageCircle className="w-4 h-4 fill-black" />
            <span>Share directly on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
