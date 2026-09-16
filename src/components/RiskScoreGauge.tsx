import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { RiskLevel } from '../types';

interface RiskScoreGaugeProps {
  score: number; // 0 - 100
  riskLevel: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskScoreGauge: React.FC<RiskScoreGaugeProps> = ({
  score,
  riskLevel,
  size = 'md',
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1200; // ms
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * score);
      setAnimatedScore(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [score]);

  // Dimensions for semi-circle arc
  const radius = 80;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Determine status color and text
  const getStatusConfig = () => {
    if (score <= 30) {
      return {
        color: '#22C55E',
        glow: 'rgba(34, 197, 94, 0.4)',
        label: 'Looks Safe',
        sublabel: 'No fraud indicators detected',
        icon: ShieldCheck,
        badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      };
    } else if (score <= 70) {
      return {
        color: '#F59E0B',
        glow: 'rgba(245, 158, 11, 0.4)',
        label: 'Caution Required',
        sublabel: 'Suspicious elements detected',
        icon: AlertTriangle,
        badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      };
    } else {
      return {
        color: '#EF4444',
        glow: 'rgba(239, 68, 68, 0.4)',
        label: 'Likely Scam',
        sublabel: 'Immediate threat to personal funds',
        icon: ShieldAlert,
        badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40',
      };
    }
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* SVG Arc Gauge */}
      <div className="relative flex items-center justify-center">
        <svg
          width="220"
          height="130"
          viewBox="0 0 220 130"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
            <filter id="gaugeGlow">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={status.color} floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d="M 25 115 A 80 80 0 0 1 195 115"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Arc */}
          <path
            d="M 25 115 A 80 80 0 0 1 195 115"
            fill="none"
            stroke={status.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Center Score & Icon Display */}
        <div className="absolute top-[35px] flex flex-col items-center">
          <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-mono">
            {animatedScore}
          </span>
          <span className="text-[11px] text-gray-400 font-semibold tracking-wider uppercase mt-0.5">
            Risk Score / 100
          </span>
        </div>
      </div>

      {/* Status Badge & Descriptor */}
      <div className="mt-3 flex flex-col items-center text-center">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${status.badgeClass} shadow-md`}>
          <StatusIcon className="w-4 h-4" />
          <span>{status.label}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
          {status.sublabel}
        </p>
      </div>

      {/* Scale markers */}
      <div className="w-full max-w-[210px] flex justify-between text-[10px] text-gray-500 font-mono mt-2 pt-1 border-t border-white/5">
        <span className="text-emerald-500 font-medium">0 Safe</span>
        <span className="text-amber-500 font-medium">50 Caution</span>
        <span className="text-red-500 font-medium">100 Scam</span>
      </div>
    </div>
  );
};
