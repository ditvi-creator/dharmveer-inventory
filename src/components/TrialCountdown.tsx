import React, { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface TrialCountdownProps {
  trialStartedAt: number;
}

export const TrialCountdown: React.FC<TrialCountdownProps> = ({ trialStartedAt }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
      const endTime = trialStartedAt + threeDaysInMs;
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(remaining);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [trialStartedAt]);

  if (timeLeft <= 0) return null;

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 mb-4 self-end"
    >
      <div className="bg-white/20 p-1 rounded-md">
        <Clock className="w-3.5 h-3.5" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-wider leading-none opacity-80">Trial Ending In</span>
        <span className="text-sm font-black tabular-nums tracking-tight">
          {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
      <div className="h-6 w-[1px] bg-white/20 mx-1" />
      <button 
        onClick={() => window.dispatchEvent(new CustomEvent('open-pricing'))}
        className="text-[10px] font-black uppercase tracking-wider bg-white text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors shadow-sm"
      >
        Subscribe
      </button>
    </motion.div>
  );
};
