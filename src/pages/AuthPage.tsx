import React, { useState } from 'react';
import {
  Shield,
  ArrowRight,
  ArrowLeft,
  Users,
  Heart,
  User,
  LogIn,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface AuthPageProps {
  onComplete: (circleName: string) => void;
  onCancel: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onComplete, onCancel }) => {
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [audienceType, setAudienceType] = useState<'parents' | 'family' | 'myself'>('parents');
  
  // Registration form fields
  const [circleName, setCircleName] = useState('Sharma Family Circle');
  const [userName, setUserName] = useState('Rahul Sharma');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPhone, setUserPhone] = useState('+91 98201 44819');

  // Login form fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          password: userPassword,
          phone: userPhone,
          circleName,
          relation: audienceType === 'parents' ? 'Son / Daughter' : 'Guardian',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      onComplete(data.family?.name || circleName);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      onComplete(data.family?.name || 'Family Circle');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (audienceType === 'parents') setCircleName('Parents Protection Circle');
      else if (audienceType === 'family') setCircleName('Sharma Family Circle');
      else setCircleName('Personal AI Guard');
      setStep(2);
    } else if (step === 2) {
      if (!userName.trim()) {
        setErrorMsg('Please enter your name.');
        return;
      }
      if (!userEmail.trim() || !userEmail.includes('@')) {
        setErrorMsg('Please provide a valid email address.');
        return;
      }
      if (!userPassword || userPassword.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      setStep(3);
    } else {
      handleRegister();
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

          {authMode === 'register' ? (
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
          ) : (
            <span className="text-xs font-mono text-[#5B8FFF] uppercase font-semibold">
              Member Sign In
            </span>
          )}
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center p-1 bg-[#0B0F14] border border-white/10 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              authMode === 'register'
                ? 'bg-[#5B8FFF] text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Create New Circle
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              authMode === 'login'
                ? 'bg-[#5B8FFF] text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Existing Member Sign In
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* LOGIN MODE */}
        {authMode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Welcome back to your Circle
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Enter your credentials to manage alerts and monitor family threats.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="e.g. rahul.sharma@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F14] border border-white/10 text-white text-sm focus:outline-none focus:border-[#5B8FFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F14] border border-white/10 text-white text-sm focus:outline-none focus:border-[#5B8FFF]"
              />
            </div>

            <div className="pt-4 flex items-center justify-between gap-4 border-t border-white/10">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-white text-xs font-semibold transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5B8FFF] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* REGISTRATION WIZARD (STEPS 1, 2, 3) */
          <>
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

            {/* SCREEN 2: CREATE FAMILY CIRCLE & ACCOUNT */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-mono text-[#5B8FFF] font-semibold uppercase tracking-wider">
                    Step 02 / 03
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                    Circle & Account Details
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Configure your protection circle and guardian login.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                      Circle Name
                    </label>
                    <input
                      type="text"
                      value={circleName}
                      onChange={(e) => setCircleName(e.target.value)}
                      placeholder="e.g. Sharma Family Circle"
                      className="w-full px-3 py-2 rounded-xl bg-[#0B0F14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#5B8FFF]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                        Your Name (Admin)
                      </label>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3 py-2 rounded-xl bg-[#0B0F14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#5B8FFF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                        WhatsApp Number
                      </label>
                      <input
                        type="text"
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        placeholder="+91 98201 44819"
                        className="w-full px-3 py-2 rounded-xl bg-[#0B0F14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#5B8FFF] font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                      Email Address (for login)
                    </label>
                    <input
                      type="email"
                      required
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      className="w-full px-3 py-2 rounded-xl bg-[#0B0F14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#5B8FFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                      Password (min. 6 characters)
                    </label>
                    <input
                      type="password"
                      required
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl bg-[#0B0F14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#5B8FFF]"
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
                  disabled={loading}
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
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5B8FFF] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>{step === 3 ? (loading ? 'Creating Circle...' : 'Launch ScamShield Dashboard') : 'Continue'}</span>
                {!loading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
