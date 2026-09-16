import React, { useState } from 'react';
import { X, Send, Upload, Sparkles, AlertCircle, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { FamilyMember, MessageItem } from '../types';

interface QuickForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: FamilyMember[];
  onAnalyzeMessage: (senderMemberId: string, text: string, linkUrl?: string, imageUrl?: string) => Promise<MessageItem>;
}

export const QuickForwardModal: React.FC<QuickForwardModalProps> = ({
  isOpen,
  onClose,
  members,
  onAnalyzeMessage,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || 'mem_sunita');
  const [text, setText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Quick preset templates for rapid testing during demo
  const samplePresets = [
    {
      title: 'Electricity Bill Cutoff',
      text: 'URGENT: Your electricity power supply will be disconnected tonight at 9:30 PM due to pending bill update. Immediately contact Electricity Officer Shri Sharma at 98210-94819 or pay via http://power-bijli-bill-update.online/pay',
      link: 'http://power-bijli-bill-update.online/pay',
    },
    {
      title: 'HDFC NetBanking KYC Freeze',
      text: 'Dear Customer, your Bank Account KYC has expired. Immediate update required within 24 hours to prevent account block. Update here: http://kyc-update-hdfc-secure.link',
      link: 'http://kyc-update-hdfc-secure.link',
    },
    {
      title: 'Grandchild Phone Lost Urgent Cash',
      text: 'Hi Grandma! My phone fell in the river and broke, using a friend’s phone right now. Need $450 urgently to pay the doctor and taxi ride. Send to this UPI: friend_rahul99@oksbi',
      link: '',
    },
    {
      title: 'Legitimate Swiggy OTP',
      text: '781920 is your Swiggy OTP verification code for order #5491. Do not share this code with anyone.',
      link: '',
    },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !linkUrl.trim() && !imagePreview) {
      setError('Please provide message text, a link, or a screenshot.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    try {
      await onAnalyzeMessage(selectedMemberId, text, linkUrl || undefined, imagePreview || undefined);
      setIsAnalyzing(false);
      setText('');
      setLinkUrl('');
      setImagePreview(null);
      onClose();
    } catch (err) {
      setIsAnalyzing(false);
      setError('Analysis failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#121821] border border-white/15 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E]">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Forward Suspicious Message</h2>
              <p className="text-xs text-gray-400">Simulate incoming WhatsApp message or screenshot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Templates */}
        <div className="mb-5">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Demo Presets (1-Click Test)
          </div>
          <div className="grid grid-cols-2 gap-2">
            {samplePresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setText(preset.text);
                  setLinkUrl(preset.link);
                }}
                className="text-left p-2.5 rounded-xl bg-[#0B0F14] hover:bg-[#1a2330] border border-white/10 text-xs transition group"
              >
                <div className="font-semibold text-gray-200 group-hover:text-[#5B8FFF] flex items-center justify-between">
                  <span>{preset.title}</span>
                  <Sparkles className="w-3 h-3 text-[#5B8FFF] opacity-0 group-hover:opacity-100 transition" />
                </div>
                <div className="text-[11px] text-gray-500 truncate mt-0.5">{preset.text}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sender Family Member Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Who received this message?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {members.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs text-left transition ${
                    selectedMemberId === m.id
                      ? 'bg-[#5B8FFF]/20 border-[#5B8FFF] text-white'
                      : 'bg-[#0B0F14] border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <img
                    src={m.avatarUrl}
                    alt={m.name}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="truncate">
                    <div className="font-semibold truncate">{m.relation}</div>
                    <div className="text-[10px] text-gray-500 truncate">{m.name.split(' ')[0]}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Message Text Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
              <span>Suspicious Message Text</span>
              <span className="text-[11px] text-gray-500 font-normal">WhatsApp forward / SMS</span>
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste message contents here (e.g. 'Your bank account will be blocked...')"
              className="w-full px-3 py-2.5 rounded-xl bg-[#0B0F14] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#5B8FFF] focus:ring-1 focus:ring-[#5B8FFF] transition"
            />
          </div>

          {/* Suspicious URL link input */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-[#5B8FFF]" />
              <span>Link URL (Optional)</span>
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="http://sbi-power-bill-verify.top"
              className="w-full px-3 py-2 rounded-xl bg-[#0B0F14] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#5B8FFF] transition font-mono"
            />
          </div>

          {/* Screenshot Upload preview */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[#5B8FFF]" />
              <span>Screenshot / Image (Optional)</span>
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0B0F14] hover:bg-[#1a2330] border border-white/10 text-xs text-gray-300 transition">
                <Upload className="w-4 h-4 text-[#5B8FFF]" />
                <span>Upload Screenshot</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-12 h-12 rounded-lg object-cover border border-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAnalyzing}
              className={`px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B8FFF] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition ${
                isAnalyzing ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Running AI Fraud Analysis...' : 'Analyze with AI Guard'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
