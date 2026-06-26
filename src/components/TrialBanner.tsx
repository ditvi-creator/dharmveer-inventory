import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Timer, Sparkles, ArrowRight } from 'lucide-react';

interface TrialBannerProps {
  trialStartedAt: number | null;
  onUpgradeClick: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ trialStartedAt, onUpgradeClick }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isLowTime, setIsLowTime] = useState<boolean>(false);

  useEffect(() => {
    if (!trialStartedAt) return;

    const calculateTimeLeft = () => {
      const trialDurationMs = 72 * 60 * 60 * 1000; // 72 hours
      const expirationTime = trialStartedAt + trialDurationMs;
      const difference = expirationTime - Date.now();

      if (difference <= 0) {
        setTimeLeft('Expired');
        setIsLowTime(true);
        return;
      }

      // Calculate days, hours, minutes, seconds
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // Warning state if less than 12 hours remaining
      if (difference < 12 * 60 * 60 * 1000) {
        setIsLowTime(true);
      } else {
        setIsLowTime(false);
      }

      // Build readable string
      const daysStr = days > 0 ? `${days}d ` : '';
      const hoursStr = `${hours.toString().padStart(2, '0')}h `;
      const minutesStr = `${minutes.toString().padStart(2, '0')}m `;
      const secondsStr = `${seconds.toString().padStart(2, '0')}s`;

      setTimeLeft(`${daysStr}${hoursStr}${minutesStr}${secondsStr}`);
    };

    // Calculate immediately and set interval
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [trialStartedAt]);

  if (!trialStartedAt || timeLeft === 'Expired') return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`relative w-full overflow-hidden border-b transition-colors duration-300 ${
        isLowTime 
          ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 border-red-700/30' 
          : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 border-indigo-700/30'
      }`}
    >
      {/* Background ambient lighting effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:16px] pointer-events-none" />
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col md:flex-row items-center justify-between gap-3 text-white">
        {/* Left column: Icon and info */}
        <div className="flex items-center gap-3 text-center md:text-left">
          <div className="bg-white/15 p-1.5 rounded-lg backdrop-blur-xs flex items-center justify-center animate-pulse shrink-0">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-sm tracking-wide uppercase">
                {isLowTime ? '⚠️ Limited Trial Remaining' : '⚡ Pro Trial Account'}
              </span>
              <span className="hidden sm:inline text-white/45">•</span>
              <p className="text-xs font-semibold text-white/90">
                You have unrestricted access to all Pro inventory tracking tools. No credit card required.
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Ticker countdown & Action Button */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 shrink-0">
          <div className="bg-black/25 px-3 py-1 rounded-xl border border-white/10 flex items-center gap-2 backdrop-blur-xs">
            <Timer className={`w-4 h-4 shrink-0 ${isLowTime ? 'text-red-400 animate-bounce' : 'text-blue-300'}`} />
            <span className="font-mono text-xs font-black tracking-wider min-w-[90px] text-center">
              {timeLeft}
            </span>
          </div>

          <button
            onClick={onUpgradeClick}
            className="group relative flex items-center gap-1.5 bg-white text-gray-950 font-extrabold text-xs px-4 py-2 rounded-xl shadow-md hover:bg-gray-100 active:scale-95 transition-all"
          >
            {/* Shimmer effect */}
            <span className="absolute inset-0 w-full h-full rounded-xl bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
            <span>Upgrade Plan Now</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
