import React, { useState } from 'react';
import { Shield, Sparkles, ArrowRight, Lock, CheckCircle2, AlertTriangle, Users, MessageSquare, ChevronRight } from 'lucide-react';
import { ThreeShield } from '../components/ThreeShield';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface LandingPageProps {
  onEnterDemo: () => void;
  onStartAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterDemo, onStartAuth }) => {
  const [isTryDemoHovered, setIsTryDemoHovered] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E5E7EB] flex flex-col selection:bg-[#5B8FFF]/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0B0F14]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5B8FFF] to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">ScamShield</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#5B8FFF]/15 text-[#5B8FFF] border border-[#5B8FFF]/30">
              AI Copilot
            </span>
          </div>

          <div className="flex items-center gap-3">
            <PWAInstallButton compact />
            <button
              onClick={onStartAuth}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition"
            >
              Log In
            </button>
            <button
              onClick={onEnterDemo}
              onMouseEnter={() => setIsTryDemoHovered(true)}
              onMouseLeave={() => setIsTryDemoHovered(false)}
              className="px-4 py-2 rounded-xl bg-[#5B8FFF] hover:bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition active:scale-95 flex items-center gap-1.5"
            >
              <span>Try Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-6">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#5B8FFF]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-[#22C55E]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B8FFF]/10 border border-[#5B8FFF]/30 text-[#5B8FFF] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Built for Non-Tech-Savvy Parents & Grandparents</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              ScamShield – Your Family’s{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B8FFF] via-blue-400 to-emerald-400">
                AI Fraud Copilot
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-400 max-w-2xl leading-relaxed">
              Family members forward suspicious WhatsApp messages, calls, or screenshots to a shared AI assistant that flags scams in plain language and alerts the family circle in real time.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onEnterDemo}
                onMouseEnter={() => setIsTryDemoHovered(true)}
                onMouseLeave={() => setIsTryDemoHovered(false)}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#5B8FFF] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-500/30 flex items-center gap-2 transition active:scale-95 group"
              >
                <span>Try Live Demo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={onStartAuth}
                className="px-6 py-3.5 rounded-xl bg-[#121821] hover:bg-[#1a2330] border border-white/15 text-white font-semibold text-sm transition flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-[#5B8FFF]" />
                <span>Create Family Circle</span>
              </button>
            </div>

            {/* Stats micro-strip */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-6 max-w-lg">
              <div>
                <div className="text-2xl font-extrabold text-white font-mono">99.4%</div>
                <div className="text-xs text-gray-400">Scam Detection Rate</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-emerald-400 font-mono">&lt;2 sec</div>
                <div className="text-xs text-gray-400">Analysis Speed</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[#5B8FFF] font-mono">100%</div>
                <div className="text-xs text-gray-400">Plain Language</div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Interactive Shield Canvas */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative w-full aspect-square max-w-[420px] flex items-center justify-center">
              {/* Outer decorative ring */}
              <div className="absolute inset-0 rounded-full border border-dashed border-[#5B8FFF]/20 animate-[spin_40s_linear_infinite] pointer-events-none" />
              <ThreeShield
                size="lg"
                riskLevel="default"
                isHovered={isTryDemoHovered}
                interactive={true}
              />
            </div>
            <div className="text-center mt-2">
              <span className="text-xs font-mono text-gray-500 flex items-center gap-1.5 justify-center">
                <span className="w-2 h-2 rounded-full bg-[#5B8FFF] animate-pulse" />
                Interactive 3D Guard • Move mouse to tilt
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section className="py-20 px-6 bg-[#0E141C] border-y border-white/10">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <div className="space-y-3 max-w-2xl mx-auto">
            <div className="text-xs font-bold text-[#5B8FFF] uppercase tracking-wider font-mono">
              Simple 3-Step Flow
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Zero Tech Knowledge Required
            </h2>
            <p className="text-sm text-gray-400">
              Parents simply forward any weird message to the ScamShield WhatsApp contact, and the entire family stays safe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Step 1 */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-[#5B8FFF]/40 transition hover:-translate-y-1 duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#5B8FFF]/10 border border-[#5B8FFF]/30 text-[#5B8FFF] flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="text-xs font-mono text-[#5B8FFF] font-semibold mb-1">STEP 01</div>
              <h3 className="text-lg font-bold text-white mb-2">Forward to ScamShield</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Forward suspicious WhatsApp messages, screenshots, bills, or unknown phone numbers straight to your family's AI assistant.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-[#5B8FFF]/40 transition hover:-translate-y-1 duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="text-xs font-mono text-purple-400 font-semibold mb-1">STEP 02</div>
              <h3 className="text-lg font-bold text-white mb-2">AI Analyzes in Seconds</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Gemini LLM & Vision models inspect pressure tactics, fake bank URLs, altered logos, and malicious payment links instantly.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-[#22C55E]/40 transition hover:-translate-y-1 duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition">
                <Shield className="w-6 h-6" />
              </div>
              <div className="text-xs font-mono text-[#22C55E] font-semibold mb-1">STEP 03</div>
              <h3 className="text-lg font-bold text-white mb-2">Clear Family Alerts</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Everyone gets plain-language warnings: Safe, Caution, or Scam — with simple bullets explaining exactly why and what to do.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Preview (Embedded Interactive Mini-Dashboard) */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="text-xs font-bold text-[#EF4444] uppercase tracking-wider font-mono">
              Interactive Preview
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              See How Plain Language Stops Fraud
            </h2>
            <p className="text-sm text-gray-400 max-w-xl mx-auto">
              No cybersecurity jargon. Just clear explanations your grandma can understand in 5 seconds.
            </p>
          </div>

          {/* Embedded Sample Threat Card */}
          <div className="glass-panel-danger p-6 sm:p-8 rounded-3xl border border-red-500/30 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">Fake Electricity Cutoff Notice</h4>
                    <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold tracking-wide">
                      SCAM DETECTED
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Targeted at Mother (Sunita Sharma) via WhatsApp</p>
                </div>
              </div>

              <div className="text-right font-mono text-xs">
                <span className="text-red-400 font-bold text-lg">96/100</span>
                <span className="text-gray-400 block text-[10px]">Threat Score</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Original Message Quote */}
              <div className="md:col-span-5 bg-[#0B0F14] p-4 rounded-2xl border border-white/10 text-xs space-y-2">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                  <span>WhatsApp Forwarded Content</span>
                  <span className="text-emerald-400">10:14 AM</span>
                </div>
                <div className="bg-[#121821] p-3 rounded-xl border border-white/5 text-gray-300 font-sans italic leading-relaxed">
                  "URGENT: Your power supply will be disconnected tonight at 9:30 PM due to pending bill update. Immediately contact Officer Sharma at 98210-94819 or pay via power-bijli-bill-update.online/pay"
                </div>
              </div>

              {/* Plain-Language Explanation */}
              <div className="md:col-span-7 space-y-3">
                <div className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                  Why This Is Dangerous (AI Breakdown):
                </div>
                <ul className="space-y-2 text-xs text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                    <span><strong>Fake Time Pressure:</strong> Threatens power cutoff in a few hours to stop you from thinking clearly.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                    <span><strong>Private Phone Number:</strong> Official electricity boards never use personal mobile numbers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                    <span><strong>Fraudulent Link:</strong> The website address is only 4 days old and attempts to steal bank PINs.</span>
                  </li>
                </ul>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Recommended: Pay bills only via official Gov app
                  </span>
                  <button
                    onClick={onEnterDemo}
                    className="px-4 py-2 rounded-xl bg-[#5B8FFF] hover:bg-blue-600 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span>Explore Full Demo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Privacy Section */}
      <section className="py-16 px-6 bg-[#0B0F14] border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex p-3 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] mb-2 animate-pulse">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Built with Strict Family Privacy First
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="p-4 rounded-xl bg-[#121821] border border-white/10 space-y-1.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                Only Analyzes Forwards
              </div>
              <p className="text-xs text-gray-400">
                We never read your personal private chats. Only messages explicitly forwarded are analyzed.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121821] border border-white/10 space-y-1.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                Zero Data Selling
              </div>
              <p className="text-xs text-gray-400">
                Your family's contact info, phone numbers, and messages are never monetized or sold to third parties.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121821] border border-white/10 space-y-1.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                Auto-Delete Controls
              </div>
              <p className="text-xs text-gray-400">
                Set messages to automatically wipe from records after 30 days for peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 py-8 px-6 bg-[#0B0F14]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#5B8FFF]" />
            <span className="font-bold text-gray-300">ScamShield AI</span>
            <span>– Built to protect families in the age of digital fraud.</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={onEnterDemo} className="hover:text-gray-300 transition">Live Demo</button>
            <button onClick={onStartAuth} className="hover:text-gray-300 transition">Family Setup</button>
            <span>Privacy Policy</span>
            <span>Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
