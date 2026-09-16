import React, { useState } from 'react';
import {
  Shield,
  ArrowRight,
  ArrowLeft,
  Users,
  Heart,
  User,
} from 'lucide-react';

interface AuthPageProps {
  onComplete: (circleName: string) => void;
  onCancel: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [audienceType, setAudienceType] = useState<'parents' | 'family' | 'myself'>('parents');
  const [circleName, setCircleName] = useState('Sharma Family Circle');
  const [userName, setUserName] = useState('Rahul Sharma');
  const [userPhone, setUserPhone] = useState('+91 98201 44819');

  const handleNext = () => {
    if (step === 1) {
      if (audienceType === 'parents') setCircleName('Parents Protection Circle');
      else if (audienceType === 'family') setCircleName('Sharma Family Circle');
      else setCircleName('Personal AI Guard');
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      onComplete(circleName);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E5E7EB] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#5B8FFF]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative w-full max-w-lg rounded-3xl bg-[#121821] border border-white/15 p-6 sm:p-8 shadow-2xl z-10">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5B8FFF] to-blue-700 flex items-center justify-center shadow">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">ScamShield</span>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === s ? 'w-6 bg-[#5B8FFF]' : step > s ? 'w-3 bg-emerald-500' : 'w-3 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* SCREEN 1: WHO IS THIS FOR? */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-mono text-[#5B8FFF] font-semibold uppercase tracking-wider">
                Step 01 / 03
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                Who are you protecting today?
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                We'll tailor the interface contrast and alert language accordingly.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'parents',
                  title: 'Elderly Parents / Grandparents',
                  desc: 'Optimized for non-tech users with extra high-contrast Elder Mode and automatic plain-language WhatsApp warnings.',
                  icon: Heart,
                  badge: 'Recommended',
                },
                {
                  id: 'family',
                  title: 'Entire Family Circle',
                  desc: 'Protects parents, siblings, and kids with a shared risk map and real-time cross-family scam alerts.',
                  icon: Users,
                  badge: null,
                },
                {
                  id: 'myself',
                  title: 'Just Myself for Now',
                  desc: 'Instant verification for job scams, bank phishing links, and crypto fraud messages.',
                  icon: User,
                  badge: null,
                },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = audienceType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAudienceType(item.id as any)}
                    className={`w-full p-4 rounded-2xl border text-left transition flex items-start gap-3.5 group ${
                      isSelected
                        ? 'bg-[#5B8FFF]/15 border-[#5B8FFF] shadow-lg shadow-blue-500/10'
                        : 'bg-[#0B0F14] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 ${
                        isSelected ? 'bg-[#5B8FFF] text-white' : 'bg-white/5 text-gray-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{item.title}</span>
                        {item.badge && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SCREEN 2: CREATE FAMILY CIRCLE */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-mono text-[#5B8FFF] font-semibold uppercase tracking-wider">
                Step 02 / 03
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                Name your Family Circle
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Your family members will see this name when receiving alerts.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Circle Name
                </label>
                <input
                  type="text"
                  value={circleName}
                  onChange={(e) => setCircleName(e.target.value)}
                  placeholder="e.g. Sharma Family Circle"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F14] border border-white/10 text-white text-sm focus:outline-none focus:border-[#5B8FFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Your Name (Admin / Guardian)
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F14] border border-white/10 text-white text-sm focus:outline-none focus:border-[#5B8FFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Your WhatsApp Number
                </label>
                <input
                  type="text"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="+91 98201 44819"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F14] border border-white/10 text-white text-sm focus:outline-none focus:border-[#5B8FFF] font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 3: HOW TO USE */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                Step 03 / 03 • Ready to Guard
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                How ScamShield Protects You
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                3 simple actions that stop financial and identity theft before it happens.
              </p>
            </div>

            <div className="space-y-3 bg-[#0B0F14] p-4 rounded-2xl border border-white/10 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <div className="font-bold text-white">Save ScamShield Contact</div>
                  <div className="text-gray-400 mt-0.5">
                    Add the ScamShield AI bot to WhatsApp contacts as "Family Fraud Guard".
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-white/5">
                <div className="w-6 h-6 rounded-lg bg-[#5B8FFF]/20 text-[#5B8FFF] flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <div className="font-bold text-white">Forward Weird Messages</div>
                  <div className="text-gray-400 mt-0.5">
                    Whenever parents receive sudden prize, bank KYC, or power cutoff notices, simply forward them.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-white/5">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <div className="font-bold text-white">Instant Verdict & Family Defense</div>
                  <div className="text-gray-400 mt-0.5">
                    Gemini AI responds in plain language, explaining the trick and alerting guardians.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between gap-4">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2.5 rounded-xl bg-[#0B0F14] hover:bg-white/5 text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <button
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-white text-xs font-semibold transition"
            >
              Cancel
            </button>
          )}

          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5B8FFF] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 transition active:scale-95"
          >
            <span>{step === 3 ? 'Launch ScamShield Dashboard' : 'Continue'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
