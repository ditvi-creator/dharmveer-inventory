import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, ArrowRightLeft, HelpCircle, AlertTriangle } from 'lucide-react';
import { StockItem, Godown } from '../types';
import { toast } from 'sonner';

interface TransferModalProps {
  item: StockItem;
  godowns: Godown[];
  onClose: () => void;
  onUpdateItem: (id: string, updates: Partial<StockItem>) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  item,
  godowns,
  onClose,
  onUpdateItem
}) => {
  // Ensure we have at least MP and KL if no godowns are configured
  const activeGodowns = godowns.length > 0 ? godowns : [
    { id: 'MP', name: 'MP' },
    { id: 'KL', name: 'KL' }
  ];

  // Helper to retrieve stock of the item in a specific godown
  const getGodownStock = (godownId: string): number => {
    if (godownId === 'MP') return item.openingStockMP || 0;
    if (godownId === 'KL') return item.openingStockKL || 0;
    return item.godownStocks?.[godownId] || 0;
  };

  // Find godowns with stock > 0 to set as default source
  const godownsWithStock = activeGodowns.filter(g => getGodownStock(g.id) > 0);
  
  const [sourceId, setSourceId] = useState<string>(() => {
    return godownsWithStock.length > 0 ? godownsWithStock[0].id : activeGodowns[0]?.id || '';
  });

  const [destId, setDestId] = useState<string>(() => {
    const defaultDest = activeGodowns.find(g => g.id !== sourceId);
    return defaultDest ? defaultDest.id : (activeGodowns[1]?.id || '');
  });

  const [transferQty, setTransferQty] = useState<string>('');

  const sourceStock = getGodownStock(sourceId);
  const destStock = getGodownStock(destId);

  // Update destination if it gets set to same as source
  useEffect(() => {
    if (sourceId === destId) {
      const alternative = activeGodowns.find(g => g.id !== sourceId);
      if (alternative) {
        setDestId(alternative.id);
      }
    }
  }, [sourceId, destId, activeGodowns]);

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(transferQty);

    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid transfer quantity greater than 0.');
      return;
    }

    if (qty > sourceStock) {
      toast.error(`Insufficient stock in source godown! Available stock: ${sourceStock}`);
      return;
    }

    if (sourceId === destId) {
      toast.error('Source and Destination godowns must be different.');
      return;
    }

    const sourceName = activeGodowns.find(g => g.id === sourceId)?.name || sourceId;
    const destName = activeGodowns.find(g => g.id === destId)?.name || destId;

    const updates: Partial<StockItem> = {};
    const updatedGodownStocks = { ...(item.godownStocks || {}) };

    const newSourceVal = sourceStock - qty;
    const newDestVal = destStock + qty;

    // Apply source change
    if (sourceId === 'MP') {
      updates.openingStockMP = newSourceVal;
    } else if (sourceId === 'KL') {
      updates.openingStockKL = newSourceVal;
    } else {
      updatedGodownStocks[sourceId] = newSourceVal;
    }

    // Apply destination change
    if (destId === 'MP') {
      updates.openingStockMP = newDestVal;
    } else if (destId === 'KL') {
      updates.openingStockKL = newDestVal;
    } else {
      updatedGodownStocks[destId] = newDestVal;
    }

    // Include dynamic godownStocks if applicable
    if (sourceId !== 'MP' && sourceId !== 'KL' || destId !== 'MP' && destId !== 'KL') {
      updates.godownStocks = updatedGodownStocks;
    }

    try {
      onUpdateItem(item.id, updates);
      toast.success(`Successfully transferred ${qty} ${item.unit || 'BOX'} of ${item.name} from ${sourceName} to ${destName}!`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to complete stock transfer.');
    }
  };

  const handleSetMax = () => {
    if (sourceStock > 0) {
      setTransferQty(sourceStock.toString());
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
              <ArrowRightLeft className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Transfer Stock</h3>
              <p className="text-xs text-blue-100 font-medium">Shift materials across godowns instantly</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group"
            title="Close modal"
          >
            <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Modal content */}
        <form onSubmit={handleTransferSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto">
          {/* Item details card */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-0.5">Selected Material</span>
              <h4 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white leading-tight">{item.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                {item.category && (
                  <span className="text-[11px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/30">
                    {item.category}
                  </span>
                )}
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Size: <strong className="text-gray-700 dark:text-gray-300 font-semibold">{item.size}</strong></span>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 p-2.5 rounded-xl shadow-xs text-center shrink-0 min-w-[70px]">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase font-bold tracking-wider mb-0.5">Total Bal</span>
              <span className="text-base font-black text-gray-900 dark:text-white">{item.balance} <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{item.unit || 'BOX'}</span></span>
            </div>
          </div>

          {/* Warehouse Stock Overview Grid */}
          <div>
            <label className="text-[11px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider block mb-2">Current Warehouse Stocks</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeGodowns.map(g => {
                const stock = getGodownStock(g.id);
                const isSelected = g.id === sourceId;
                const isDest = g.id === destId;

                return (
                  <div 
                    key={g.id} 
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected 
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-900/60' 
                        : isDest 
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-300/60 dark:border-emerald-900/40'
                          : 'bg-white dark:bg-gray-850 border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 block uppercase truncate">{g.name}</span>
                    <span className="text-sm font-extrabold text-gray-900 dark:text-white block mt-0.5">{stock} {item.unit || 'BOX'}</span>
                    {isSelected && (
                      <span className="inline-block text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider mt-0.5">Source</span>
                    )}
                    {isDest && (
                      <span className="inline-block text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider mt-0.5">Dest</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transfer Directions */}
          <div className="grid grid-cols-2 gap-4">
            {/* Source Godown */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="source-godown" className="text-[11px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">From Godown (Source)</label>
              <select
                id="source-godown"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm font-medium rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
              >
                {activeGodowns.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({getGodownStock(g.id)} {item.unit || 'BOX'})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Godown */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dest-godown" className="text-[11px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">To Godown (Destination)</label>
              <select
                id="dest-godown"
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm font-medium rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
              >
                {activeGodowns
                  .filter(g => g.id !== sourceId)
                  .map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({getGodownStock(g.id)} {item.unit || 'BOX'})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Transfer Quantity Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="transfer-qty" className="text-[11px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">Transfer Quantity</label>
              <button
                type="button"
                onClick={handleSetMax}
                disabled={sourceStock <= 0}
                className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-150 dark:border-blue-900/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Set Max ({sourceStock})
              </button>
            </div>
            <div className="relative rounded-xl shadow-xs">
              <input
                id="transfer-qty"
                type="number"
                min="1"
                max={sourceStock}
                value={transferQty}
                onChange={(e) => setTransferQty(e.target.value)}
                placeholder="Enter amount to move"
                className="w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-sm font-bold rounded-xl p-3.5 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase select-none">
                {item.unit || 'BOX'}
              </div>
            </div>
          </div>

          {/* Warning state if stock is zero */}
          {sourceStock === 0 && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl flex gap-2.5 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-extrabold text-amber-850 dark:text-amber-300 block leading-tight">No stock available for transfer</span>
                <span className="text-[11px] text-amber-700 dark:text-amber-400/90 font-medium">Please select a different source warehouse that currently contains items.</span>
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center gap-2.5 mt-2.5 border-t border-gray-100 dark:border-gray-800 pt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-700 dark:text-gray-300 font-extrabold text-sm rounded-xl transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sourceStock <= 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm rounded-xl shadow-md shadow-blue-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Confirm Transfer</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
