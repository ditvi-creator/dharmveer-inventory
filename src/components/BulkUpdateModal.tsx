import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Check, Tags, Layers, AlertCircle, PenLine, ChevronRight } from 'lucide-react';
import { StockItem } from '../types';
import { toast } from 'sonner';

interface BulkUpdateModalProps {
  selectedItems: StockItem[];
  allItems: StockItem[];
  onClose: () => void;
  onBulkUpdate: (ids: string[], updates: Partial<StockItem>) => Promise<void> | void;
}

export const BulkUpdateModal: React.FC<BulkUpdateModalProps> = ({
  selectedItems,
  allItems,
  onClose,
  onBulkUpdate,
}) => {
  // Update toggle states
  const [updateCategory, setUpdateCategory] = useState(false);
  const [updateUnit, setUpdateUnit] = useState(false);
  const [updateReorderLevel, setUpdateReorderLevel] = useState(false);

  // Field values
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('BOX');
  const [reorderLevel, setReorderLevel] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive unique categories for auto-suggestions
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    allItems.forEach(item => {
      if (item.category) categories.add(item.category.trim());
    });
    return Array.from(categories).filter(Boolean).sort();
  }, [allItems]);

  const handleApply = async () => {
    if (!updateCategory && !updateUnit && !updateReorderLevel) {
      toast.error('Please select at least one field to update.');
      return;
    }

    const updates: Partial<StockItem> = {};

    if (updateCategory) {
      updates.category = category.trim();
    }
    if (updateUnit) {
      updates.unit = unit;
    }
    if (updateReorderLevel) {
      if (reorderLevel < 0) {
        toast.error('Reorder level cannot be negative.');
        return;
      }
      updates.reorderLevel = reorderLevel;
    }

    setIsSubmitting(true);
    try {
      const selectedIds = selectedItems.map(item => item.id);
      await onBulkUpdate(selectedIds, updates);
      onClose();
    } catch (error) {
      console.error('Bulk update error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="relative bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400">
              <PenLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900 dark:text-white tracking-tight">
                Bulk Update Materials
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Apply changes to {selectedItems.length} selected row(s) simultaneously
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Items Ribbon */}
        <div className="px-6 py-3.5 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
            Selected Items ({selectedItems.length})
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-2 custom-scrollbar">
            {selectedItems.map(item => (
              <div
                key={item.id}
                className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 shadow-sm"
              >
                <span className="font-semibold truncate max-w-[120px]">{item.name}</span>
                {item.category && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md uppercase">
                    {item.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content / Inputs */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Field 1: Category */}
          <div className="group border border-gray-100 dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-900 rounded-2xl p-4 transition-all bg-white dark:bg-gray-800/50">
            <label className="flex items-start gap-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={updateCategory}
                onChange={e => setUpdateCategory(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex-1">
                <span className="font-extrabold text-sm text-gray-900 dark:text-white block">
                  Bulk Assign Category / Brand
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                  Update the category name or brand association for all selected items.
                </span>
              </div>
            </label>

            {updateCategory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 space-y-2"
              >
                <div className="relative">
                  <input
                    type="text"
                    list="bulk-categories"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Enter or select category (e.g. Morgoon)"
                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium"
                  />
                  <datalist id="bulk-categories">
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                {uniqueCategories.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mr-1">
                      Quick Select:
                    </span>
                    {uniqueCategories.slice(0, 6).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors font-medium border border-transparent hover:border-gray-200 dark:hover:border-gray-500"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Field 2: Unit */}
          <div className="group border border-gray-100 dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-900 rounded-2xl p-4 transition-all bg-white dark:bg-gray-800/50">
            <label className="flex items-start gap-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={updateUnit}
                onChange={e => setUpdateUnit(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex-1">
                <span className="font-extrabold text-sm text-gray-900 dark:text-white block">
                  Bulk Assign Packaging Unit
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                  Change measurement units (e.g., BOX, PCS, SQFT, MTR, KG) in bulk.
                </span>
              </div>
            </label>

            {updateUnit && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50"
              >
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {['BOX', 'PCS', 'SQFT', 'MTR', 'KG'].map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setUnit(option)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                        unit === option
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10'
                          : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {unit === option && <Check className="w-3.5 h-3.5" />}
                      <span>{option}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Field 3: Reorder Level */}
          <div className="group border border-gray-100 dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-900 rounded-2xl p-4 transition-all bg-white dark:bg-gray-800/50">
            <label className="flex items-start gap-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={updateReorderLevel}
                onChange={e => setUpdateReorderLevel(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex-1">
                <span className="font-extrabold text-sm text-gray-900 dark:text-white block">
                  Bulk Assign Reorder Level (Low Stock Alert)
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                  Set safety threshold levels to trigger low-inventory alerts automatically.
                </span>
              </div>
            </label>

            {updateReorderLevel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      value={reorderLevel}
                      onChange={e => setReorderLevel(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 p-3.5 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl max-w-sm">
                    <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
                    <span className="text-[11px] text-yellow-800 dark:text-yellow-300 font-medium leading-normal">
                      Items falling below this number will generate dashboard warning indicators.
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
            <Check className="w-4 h-4 text-green-500" />
            <span>Select checkbox next to field to apply</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isSubmitting || (!updateCategory && !updateUnit && !updateReorderLevel)}
              className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Apply Updates</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
