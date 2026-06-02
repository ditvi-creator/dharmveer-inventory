import React from 'react';
import { motion } from 'motion/react';
import { Check, PackageCheck, ShieldCheck } from 'lucide-react';

interface PricingProps {
  onBack: () => void;
  onSubscribe: () => void;
  onStartTrial: () => void;
  isLoggedIn: boolean;
  isTrialUsed: boolean;
}

export const Pricing: React.FC<PricingProps> = ({ 
  onBack, 
  onSubscribe, 
  onStartTrial,
  isLoggedIn,
  isTrialUsed
}) => {
  const features = [
    "Unlimited Inventory Items",
    "Real-time Stock Tracking",
    "Advanced Analytics & Trends",
    "Multi-Godown Support",
    "Professional Challan Generation",
    "AI-Powered Inventory Assistant",
    "Low Stock Notifications",
    "Priority Support"
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-gray-950 font-sans overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[5%] -right-[5%] w-[30%] h-[30%] rounded-full bg-blue-400/10 blur-[80px]"
        />
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[10%] -left-[10%] w-[35%] h-[35%] rounded-full bg-indigo-400/10 blur-[100px]"
        />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-5 bg-white dark:bg-gray-800/70 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={onBack}
        >
          <div className="bg-[#1a56db] rounded p-1.5 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <PackageCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-[17px] text-gray-900 dark:text-white tracking-tight">StockFlow</span>
        </div>
        <button 
          onClick={onBack} 
          className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Back to Home
        </button>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-20 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
            Join hundreds of businesses managing their inventory more efficiently. One plan, all features.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden"
        >
          <div className="p-10">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                PRO PLAN
              </span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-extrabold text-gray-900 dark:text-white mt-2">₹500</span>
                <span className="text-gray-500 dark:text-gray-400 font-medium">/month</span>
              </div>
            </div>

            <div className="space-y-4 mb-10">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 text-[15px]">{feature}</span>
                </div>
              ))}
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSubscribe}
              className="w-full py-4 text-center font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg shadow-blue-500/30 transition-all mb-3"
            >
              {isLoggedIn ? "Subscribe Now" : "Sign Up & Subscribe"}
            </motion.button>
            
            {!isTrialUsed && (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartTrial}
                className="w-full py-3 text-center font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-gray-700 rounded-2xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-all"
              >
                Try for 3 days free
              </motion.button>
            )}
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure 256-bit encrypted checkout
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
