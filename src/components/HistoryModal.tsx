import React from 'react';
import { StockItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowDownRight, ArrowUpRight, History } from 'lucide-react';

interface HistoryModalProps {
  item: StockItem;
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ item, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Stock History</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{item.name} • {item.size}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900/50 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto p-6 space-y-4">
            {(!item.movements || item.movements.length === 0) ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No stock movements recorded yet.</p>
                <p className="text-sm text-gray-400 dark:text-gray-400 mt-1">Changes to Stock In / Stock Out will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                {item.movements.map((movement, idx) => {
                  const isPositive = movement.qty >= 0;
                  const absQty = Math.abs(movement.qty);
                  
                  // if type is IN and qty > 0 -> Increase
                  // if type is IN and qty < 0 -> Decrease
                  // Wait, actually:
                  // IN means Stock In increased. If Stock In increased, it's an additive action to the inventory (usually). But wait, balance = opening + stockIn - stockOut.
                  // So an increase in StockIn (+qty) increases balance.
                  // An increase in StockOut (+qty) decreases balance.
                  // Let's frame it by effect on balance:
                  let displayType = '';
                  let isIncrease = false;
                  
                  if (movement.type === 'IN') {
                    isIncrease = movement.qty >= 0;
                    displayType = movement.qty >= 0 ? 'Stock In Added' : 'Stock In Reduced';
                  } else {
                    isIncrease = movement.qty < 0; 
                    displayType = movement.qty >= 0 ? 'Stock Out Added' : 'Stock Out Reduced';
                  }

                  return (
                    <div key={movement.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group select-none">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-white dark:bg-gray-800 shadow-sm z-10 shrink-0 md:mx-auto">
                        {isIncrease ? (
                          <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                            <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                            <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm group-hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`font-bold text-sm ${isIncrease ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {isIncrease ? '+' : '-'}{absQty} {item.unit || 'BOX'}
                          </span>
                          <span className="text-xs font-semibold text-gray-400 dark:text-gray-400">
                            {new Date(movement.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{displayType}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
