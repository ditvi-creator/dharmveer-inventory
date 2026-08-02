import React, { useState } from 'react';
import { History, Plus, FileText, Bell, PenLine, Trash2, Printer, AlertTriangle, ImageIcon, X, Clock, ArrowRightLeft } from 'lucide-react';
import { StockItem, Godown } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useSettingsContext } from '../SettingsContext';
import { TrialCountdown } from './TrialCountdown';
import { BulkPrintLabelsModal } from './BulkPrintLabelsModal';
import { BulkUpdateModal } from './BulkUpdateModal';
import { TransferModal } from './TransferModal';

interface StockTableProps {
  items: StockItem[];
  godowns?: Godown[]; // Added safely
  onEditItem: (item: StockItem) => void;
  onUpdateItem: (id: string, updates: Partial<StockItem>) => void;
  onBulkUpdateItem: (ids: string[], updates: Partial<StockItem>) => Promise<void> | void;
  onDeleteItem: (id: string) => void;
  onOpenBookings: (item: StockItem) => void;
  onOpenHistory: (item: StockItem) => void;
  onOpenChallan: (item: StockItem, booking: any) => void;
  trialStartedAt?: number | null;
  isSubscribed?: boolean | null;
}

// movement input code stays same...
const MovementInput = ({ currentTotal, onAdd }: { currentTotal: number, onAdd: (val: number) => void }) => {
  const [val, setVal] = useState('');
  
  const handleAdd = () => {
    const num = Number(val);
    if (!isNaN(num) && num !== 0) {
      onAdd(num);
      setVal('');
      toast.success(`Adjustment added: ${num > 0 ? '+' : ''}${num}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-xs text-gray-400 dark:text-gray-400">Tot: {currentTotal}</div>
      <div className="flex items-center">
        <input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleAdd}
          placeholder="+0"
          className="w-16 text-center border border-transparent hover:border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 rounded py-0.5 px-1 text-lg bg-transparent font-bold transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
    </div>
  );
};

export const StockTable: React.FC<StockTableProps> = ({ 
  items, 
  godowns = [],
  onEditItem, 
  onUpdateItem, 
  onBulkUpdateItem,
  onDeleteItem, 
  onOpenBookings,
  onOpenHistory,
  onOpenChallan,
  trialStartedAt,
  isSubscribed
}) => {
  const activeGodowns = godowns.length > 0 ? godowns : [{id: 'MP', name: 'MP'}];
  const { settings } = useSettingsContext();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [itemToTransfer, setItemToTransfer] = useState<StockItem | null>(null);

  const selectedItems = items.filter(item => selectedItemIds.includes(item.id));
  
  return (
    <div className="flex flex-col">
      {/* Trial Countdown - Fixed or top right relative to container */}
      {!isSubscribed && trialStartedAt && (
        <div className="flex justify-end mb-2">
          <TrialCountdown trialStartedAt={trialStartedAt} />
        </div>
      )}

      {/* Floating Selection Banner */}
      <AnimatePresence>
        {selectedItemIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            className="mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 text-white p-4 rounded-2xl shadow-lg shadow-blue-500/10 border border-blue-500/30 flex flex-col lg:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 shrink-0">
                <PenLine className="w-5 h-5 text-blue-100" />
              </div>
              <div className="text-center sm:text-left">
                <span className="font-extrabold text-sm sm:text-base tracking-tight block">
                  {selectedItemIds.length} Materials Selected
                </span>
                <span className="text-xs text-blue-100 font-medium">
                  Perform bulk operations like assigning categories, units, reorder levels, or printing labels.
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-center sm:justify-end">
              <button
                onClick={() => setSelectedItemIds([])}
                className="px-4 py-2 text-xs font-bold text-white/95 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                Clear Selection
              </button>
              <button
                onClick={() => setIsBulkUpdateModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all"
              >
                <PenLine className="w-4 h-4" />
                <span>Bulk Update</span>
              </button>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-black/5 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Bulk Print Labels</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setPreviewImage(null)}
                className="absolute -top-12 right-0 md:-right-12 p-2 text-white hover:bg-white/10 rounded-full transition-all group"
                title="Close preview"
              >
                <X className="w-8 h-8 group-hover:scale-110 transition-transform" />
              </button>
              <div className="bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-2xl overflow-hidden border border-white/20">
                <img 
                  src={previewImage} 
                  alt="Product Preview" 
                  className="max-w-full max-h-[80vh] object-contain rounded-xl"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE CARD VIEW (No horizontal scroll, all fields in one frame like Image 1) */}
      <div className="md:hidden flex flex-col gap-3">
        {/* Mobile Select All Header */}
        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">
            <input 
              type="checkbox" 
              checked={items.length > 0 && selectedItemIds.length === items.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedItemIds(items.map(item => item.id));
                } else {
                  setSelectedItemIds([]);
                }
              }}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>Select All ({items.length} Items)</span>
          </label>
          {selectedItemIds.length > 0 && (
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
              {selectedItemIds.length} Selected
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-400 text-sm italic">
            No records found. Click "Add Item" to begin.
          </div>
        ) : (
          items.map((item, index) => {
            const isLowStock = item.balance <= item.reorderLevel;
            const isSelected = selectedItemIds.includes(item.id);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`bg-white dark:bg-gray-800 rounded-2xl border p-3.5 shadow-sm transition-all flex flex-col gap-3 ${
                  isLowStock ? 'border-red-300 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10' : 'border-gray-200 dark:border-gray-700'
                } ${
                  isSelected ? 'ring-2 ring-blue-500/50 bg-blue-50/20 dark:bg-blue-900/10' : ''
                }`}
              >
                {/* Header: Checkbox, Index, Image/Avatar, Name, Specs, Balance Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItemIds(prev => [...prev, item.id]);
                        } else {
                          setSelectedItemIds(prev => prev.filter(id => id !== item.id));
                        }
                      }}
                      className="w-4.5 h-4.5 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0 mt-0.5"
                    />
                    
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 shrink-0 italic">
                      #{index + 1}
                    </span>

                    {settings.showProductImages && (
                      <button 
                        onClick={() => item.imageUrl && setPreviewImage(item.imageUrl)}
                        className={`w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0 ${item.imageUrl ? 'cursor-zoom-in active:scale-95' : 'cursor-default'}`}
                        disabled={!item.imageUrl}
                      >
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                        )}
                      </button>
                    )}

                    <div className="min-w-0 flex flex-col">
                      <span className="font-extrabold text-base text-gray-900 dark:text-white truncate leading-tight">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        {item.category && (
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/60 px-1.5 py-0.5 rounded">
                            {item.category}
                          </span>
                        )}
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                          {item.size} • {item.unit || 'BOX'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Balance Badge */}
                  <div className={`shrink-0 px-2.5 py-1 rounded-xl border flex flex-col items-center justify-center ${
                    isLowStock 
                      ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' 
                      : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  }`}>
                    <span className="text-[11px] uppercase font-bold tracking-wider opacity-75">Balance</span>
                    <span className="text-base font-black leading-tight">{item.balance}</span>
                  </div>
                </div>

                {/* Middle Grid: Godown Stocks & Movement Controls */}
                <div className="bg-gray-50/80 dark:bg-gray-900/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col gap-2.5">
                  {/* Row 1: Godown Stocks Inputs */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                      Godown Stocks
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {activeGodowns.map(g => {
                        let val = 0;
                        if (g.id === 'MP') {
                          val = item.openingStockMP || 0;
                        } else if (g.id === 'KL') {
                          val = item.openingStockKL || 0;
                        } else {
                          val = item.godownStocks?.[g.id] || 0;
                        }

                        return (
                          <div key={g.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 px-1">
                              {g.name}
                            </span>
                            <input
                              type="number"
                              value={val === 0 ? '' : val}
                              onChange={(e) => {
                                const num = e.target.value === '' ? 0 : Number(e.target.value);
                                if (g.id === 'MP') {
                                  onUpdateItem(item.id, { openingStockMP: num });
                                } else if (g.id === 'KL') {
                                  onUpdateItem(item.id, { openingStockKL: num });
                                } else {
                                  onUpdateItem(item.id, { godownStocks: { ...(item.godownStocks || {}), [g.id]: num } });
                                }
                              }}
                              placeholder="0"
                              className="w-16 text-center border border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:bg-blue-50/30 dark:focus:bg-gray-700 rounded py-0.5 px-1 text-sm font-black bg-transparent text-gray-900 dark:text-white outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 2: Movement In / Out & Reorder / Booked Metrics */}
                  <div className="grid grid-cols-4 gap-1 text-center bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 items-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase">In (+)</span>
                      <MovementInput 
                        currentTotal={item.stockIn || 0} 
                        onAdd={(val) => onUpdateItem(item.id, { stockIn: (item.stockIn || 0) + val })} 
                      />
                    </div>

                    <div className="flex flex-col items-center border-l border-gray-100 dark:border-gray-700">
                      <span className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase">Out (-)</span>
                      <MovementInput 
                        currentTotal={item.stockOut || 0} 
                        onAdd={(val) => onUpdateItem(item.id, { stockOut: (item.stockOut || 0) + val })} 
                      />
                    </div>

                    <div className="flex flex-col items-center border-l border-gray-100 dark:border-gray-700">
                      <span className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase">Reorder</span>
                      <span className="text-sm font-black text-gray-700 dark:text-gray-300 mt-0.5">{item.reorderLevel}</span>
                    </div>

                    <div className="flex flex-col items-center border-l border-gray-100 dark:border-gray-700">
                      <span className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase">Booked</span>
                      <span className="text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5">{item.booked || 0}</span>
                    </div>
                  </div>

                  {/* Row 3: Bookings & Party Name */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                        Bookings & Party Name
                      </span>
                      <button 
                        onClick={() => onOpenBookings(item)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Booking
                      </button>
                    </div>

                    {item.bookings && item.bookings.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {item.bookings.map((booking) => {
                          const scheduledDate = booking.dateOfSend ? new Date(booking.dateOfSend) : null;
                          return (
                            <div key={booking.id} className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col gap-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-900 dark:text-white truncate max-w-[160px]">
                                  {booking.partyName}
                                </span>
                                <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                                  Qty: {booking.qty}
                                </span>
                              </div>
                              {scheduledDate && (
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-between mt-1 pt-1 border-t border-gray-100 dark:border-gray-700">
                                  <span>Send: {scheduledDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const updatedBookings = item.bookings?.map(b => 
                                        b.id === booking.id ? { ...b, reminderActive: !b.reminderActive, reminderDismissed: false } : b
                                      ) || [];
                                      onUpdateItem(item.id, { bookings: updatedBookings });
                                    }}
                                    className="p-1"
                                  >
                                    <Bell className={`w-3.5 h-3.5 ${booking.reminderActive && !booking.reminderDismissed ? "text-amber-500 animate-pulse" : "text-gray-400"}`} />
                                  </button>
                                </div>
                              )}
                              <button
                                onClick={() => onOpenChallan(item, booking)}
                                className="mt-1 flex items-center justify-center gap-1 w-full text-xs font-bold text-blue-600 dark:text-blue-400 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                              >
                                <Printer className="w-3.5 h-3.5" /> Generate Challan
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                        No active bookings
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Icon Toolbar */}
                <div className="flex items-center justify-around pt-1 border-t border-gray-100 dark:border-gray-700/60 text-xs text-gray-500 dark:text-gray-400">
                  <button
                    onClick={() => onOpenHistory(item)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    <History className="w-3.5 h-3.5 text-blue-500" />
                    <span>History</span>
                  </button>

                  <button
                    onClick={() => setItemToTransfer(item)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Transfer</span>
                  </button>

                  <button
                    onClick={() => onEditItem(item)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    <PenLine className="w-3.5 h-3.5 text-amber-500" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW (hidden on mobile) */}
      <div className="hidden md:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[850px] sm:min-w-[1200px]">
          <thead>
            {/* ... table head ... */}
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {/* Select All Checkbox */}
              <th rowSpan={2} className="px-1 sm:px-4 py-2 sm:py-4 w-10 sm:w-12 text-center border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/10">
                <input 
                  type="checkbox" 
                  checked={items.length > 0 && selectedItemIds.length === items.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedItemIds(items.map(item => item.id));
                    } else {
                      setSelectedItemIds([]);
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th rowSpan={2} className="px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8 sm:w-12 border-r border-gray-100 dark:border-gray-800 italic">#</th>
              {settings.showProductImages && (
                <th rowSpan={2} className="px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800 w-12 sm:w-20">Image</th>
              )}
              <th rowSpan={2} className="px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-extrabold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800 min-w-[120px] sm:min-w-[200px]">Item Name</th>
              <th rowSpan={2} className="px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800">Size</th>
              <th rowSpan={2} className="px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800">Unit</th>
              <th colSpan={activeGodowns.length} className="px-1 py-1 sm:py-2 text-center text-xs sm:text-sm font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-r border-gray-100 dark:border-gray-800">GODOWN</th>
              <th rowSpan={2} className="px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800">In</th>
              <th rowSpan={2} className="px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800">Out</th>
              <th rowSpan={2} className="px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800">Balance</th>
              <th rowSpan={2} className="px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800">Min</th>
              <th rowSpan={2} className="px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800">Bookings</th>
              <th rowSpan={2} className="px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-extrabold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800">Party Name</th>
              <th rowSpan={2} className="px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {activeGodowns.map(g => (
                <th key={g.id} className="px-1 py-1 sm:py-2 text-center text-xs sm:text-sm font-extrabold text-gray-500 dark:text-gray-300 uppercase border-r border-gray-100 dark:border-gray-800">{g.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <AnimatePresence>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={12 + activeGodowns.length + (settings.showProductImages ? 1 : 0)} className="px-4 py-16 text-center text-gray-400 dark:text-gray-400 text-sm italic">
                    No records found. Click "Add Item" to begin.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => {
                  const isLowStock = item.balance <= item.reorderLevel;

                  return (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                      exit={{ opacity: 0 }}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group ${
                        isLowStock ? 'bg-red-50 dark:bg-red-900/20' : ''
                      } ${
                        selectedItemIds.includes(item.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      {/* Checkbox cell */}
                      <td className="px-1 sm:px-4 py-2 sm:py-4 border-r border-gray-50 dark:border-gray-800/50 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedItemIds.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItemIds(prev => [...prev, item.id]);
                            } else {
                              setSelectedItemIds(prev => prev.filter(id => id !== item.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-1 sm:px-4 py-2 sm:py-4 text-[10px] sm:text-xs text-gray-400 dark:text-gray-400 border-r border-gray-50 dark:border-gray-800/50 italic relative">
                        {index + 1}
                        {isLowStock && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-50 dark:bg-red-900/20"></div>
                        )}
                      </td>
                      {settings.showProductImages && (
                        <td className="px-1 sm:px-2 py-1 sm:py-2 border-r border-gray-50 dark:border-gray-800/50 text-center align-middle">
                          <button 
                            onClick={() => item.imageUrl && setPreviewImage(item.imageUrl)}
                            className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700 transition-all ${item.imageUrl ? 'hover:scale-105 hover:shadow-md cursor-zoom-in active:scale-95' : 'cursor-default'}`}
                            disabled={!item.imageUrl}
                          >
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-4 h-4 sm:w-6 sm:h-6 text-gray-300 dark:text-gray-600" />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="px-1 sm:px-4 py-2 sm:py-4 border-r border-gray-50 dark:border-gray-800/50">
                        <div className="flex flex-col min-w-[100px] sm:min-w-[150px]">
                          <span className="font-bold text-xs sm:text-lg text-gray-900 dark:text-white leading-tight">{item.name}</span>
                          {item.category && (
                            <span className="text-[9px] sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.category}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-lg text-gray-600 dark:text-gray-300 border-r border-gray-50 dark:border-gray-800/50">
                        {item.size}
                      </td>
                      <td className="px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-lg text-gray-500 dark:text-gray-400 border-r border-gray-50 dark:border-gray-800/50 uppercase">
                        {item.unit || 'BOX'}
                      </td>
                      
                      {activeGodowns.map(g => {
                        let val = 0;
                        if (g.id === 'MP') {
                          val = item.openingStockMP || 0;
                        } else if (g.id === 'KL') {
                          val = item.openingStockKL || 0;
                        } else {
                          val = item.godownStocks?.[g.id] || 0;
                        }
                        
                        return (
                          <td key={g.id} className="px-1 py-2 sm:py-4 text-[10px] sm:text-sm text-center font-bold border-r border-gray-50 dark:border-gray-800/50">
                            <input
                               type="number"
                               value={val === 0 ? '' : val}
                               onChange={(e) => {
                                 const num = e.target.value === '' ? 0 : Number(e.target.value);
                                 if (g.id === 'MP') {
                                   onUpdateItem(item.id, { openingStockMP: num });
                                 } else if (g.id === 'KL') {
                                   onUpdateItem(item.id, { openingStockKL: num });
                                 } else {
                                   onUpdateItem(item.id, { godownStocks: { ...(item.godownStocks || {}), [g.id]: num } });
                                 }
                               }}
                               placeholder="0"
                               className="w-10 sm:w-16 text-center border border-transparent hover:border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 rounded py-0.5 sm:py-1 px-0.5 sm:px-1 text-xs sm:text-lg bg-transparent font-bold transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                        );
                      })}
                      
                      <td className="px-1 py-2 sm:py-4 text-[10px] sm:text-sm text-center font-bold border-r border-gray-50 dark:border-gray-800/50">
                        <div className="flex flex-col items-center gap-1 scale-75 sm:scale-100">
                          <MovementInput 
                            currentTotal={item.stockIn || 0} 
                            onAdd={(val) => onUpdateItem(item.id, { stockIn: (item.stockIn || 0) + val })} 
                          />
                        </div>
                      </td>
                      <td className="px-1 py-2 sm:py-4 text-[10px] sm:text-sm text-center font-bold border-r border-gray-50 dark:border-gray-800/50">
                        <div className="flex flex-col items-center gap-1 scale-75 sm:scale-100">
                          <MovementInput 
                            currentTotal={item.stockOut || 0} 
                            onAdd={(val) => onUpdateItem(item.id, { stockOut: (item.stockOut || 0) + val })} 
                          />
                        </div>
                      </td>
                      <td className="px-1 sm:px-4 py-2 sm:py-4 border-r border-gray-50 dark:border-gray-800/50 text-center">
                        <div className={`inline-flex flex-col items-center justify-center ${
                            isLowStock 
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 shadow-[0_0_10px_rgba(220,38,38,0.2)]' 
                            : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                          } border rounded-lg w-12 h-10 sm:w-[78px] sm:h-[58px] relative`}
                        >
                          <span className="text-xs sm:text-lg font-black">{item.balance}</span>
                          {isLowStock && (
                            <span className="hidden sm:flex text-[9px] uppercase font-bold text-red-500 tracking-wider items-center gap-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-lg text-center text-gray-500 dark:text-gray-400 border-r border-gray-50 dark:border-gray-800/50">
                        {item.reorderLevel}
                      </td>
                      <td className="px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-lg text-center font-bold border-r border-gray-50 dark:border-gray-800/50">
                        {item.booked || 0}
                      </td>
                      <td className="px-1 sm:px-4 py-2 sm:py-4 text-[10px] sm:text-sm text-gray-600 dark:text-gray-300 border-r border-gray-50 dark:border-gray-800/50 align-top">
                        {item.bookings && item.bookings.length > 0 ? (
                          <div className="flex flex-col gap-2 min-w-[120px] sm:min-w-[200px]">
                            {item.bookings.map((booking, idx) => {
                              const scheduledDate = booking.dateOfSend ? new Date(booking.dateOfSend) : null;
                              
                              return (
                                <div key={booking.id} className="bg-gray-50 dark:bg-gray-900/50 p-1.5 sm:p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                                  <div className="flex justify-between items-start mb-1 sm:mb-1.5 object-right text-[11px] sm:text-[15px]">
                                    <span className="font-bold text-gray-800 dark:text-gray-200 leading-tight w-full break-normal text-left truncate max-w-[100px]">{booking.partyName}</span>
                                    <div className="flex items-center ml-1 border dark:border-gray-700 bg-white dark:focus:bg-gray-800 pl-[1px] sm:pl-[3px] rounded">
                                      <span className="text-[#2962d9] font-bold bg-blue-50 dark:bg-blue-900/20 px-1 py-0.5 rounded text-[11px] sm:text-[15px] whitespace-nowrap">
                                        {booking.qty}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {scheduledDate && (
                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700/50 flex flex-col gap-1 text-[#6b7280] text-[12px]">
                                      <div className="flex items-center gap-1.5">
                                        <History className="w-3.5 h-3.5" />
                                        <span>Send Date & Time:</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">{scheduledDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const updatedBookings = item.bookings?.map(b => 
                                              b.id === booking.id ? { ...b, reminderActive: !b.reminderActive, reminderDismissed: false } : b
                                            ) || [];
                                            onUpdateItem(item.id, { bookings: updatedBookings });
                                          }}
                                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                          title={booking.reminderActive ? "Disable reminder" : "Enable reminder"}
                                        >
                                          <Bell className={`w-5 h-5 ${booking.reminderActive && !booking.reminderDismissed ? "text-amber-500 animate-pulse" : "text-gray-400 dark:text-gray-500"}`} />
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700/50">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenChallan(item, booking);
                                      }}
                                      className="flex items-center justify-center gap-1 w-full text-[15px] font-semibold text-[#2962d9] hover:text-blue-800 py-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors mt-1"
                                    >
                                      <Printer className="w-4 h-4 ml-2" />
                                      Generate Challan
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                            <button 
                              onClick={() => onOpenBookings(item)}
                              className="text-[#2962d9] hover:text-blue-800 p-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:bg-blue-900/40 rounded-lg transition-colors"
                            >
                              <div className="flex items-center justify-center gap-1 font-semibold text-[13px]">
                                <PenLine className="w-3.5 h-3.5" />
                                Manage Bookings
                              </div>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between opacity-60">
                            <i className="text-gray-400 dark:text-gray-400">No bookings</i>
                            <button onClick={() => onOpenBookings(item)} className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:bg-blue-900/20 rounded transition-colors" title="Add Booking">
                              <Plus className="w-4 h-4 mt-[20px]" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-1 sm:px-4 py-2 sm:py-4 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2 text-gray-400 dark:text-gray-400">
                          <button onClick={() => onOpenHistory(item)} className="p-1 sm:p-1.5 text-gray-400 dark:text-gray-400 hover:text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:bg-blue-900/20 rounded-md transition-colors" title="View History">
                            <History 
                              className={index === 0 ? (activeGodowns.length === 1 ? "w-[30px] h-[30px]" : "w-[20px] h-[20px]") : "w-3.5 h-3.5 sm:w-4 sm:h-4"} 
                              style={index === 0 ? { 
                                width: activeGodowns.length === 1 ? '30px' : '20px', 
                                height: activeGodowns.length === 1 ? '30px' : '20px' 
                              } : undefined} 
                            />
                          </button>
                          <button onClick={() => setItemToTransfer(item)} className="p-1 sm:p-1.5 text-gray-400 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:bg-indigo-900/20 rounded-md transition-colors" title="Transfer Stock">
                            <ArrowRightLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button onClick={() => onEditItem(item)} className="p-1 sm:p-1.5 text-gray-400 dark:text-gray-400 hover:text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:bg-blue-900/20 rounded-md transition-colors" title="Edit Item">
                            <PenLine className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button onClick={() => onDeleteItem(item.id)} className="p-1 sm:p-1.5 text-gray-400 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:bg-red-900/20 rounded-md transition-colors" title="Delete Item">
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>

    <AnimatePresence>
      {isPrintModalOpen && (
        <BulkPrintLabelsModal 
          selectedItems={selectedItems} 
          onClose={() => setIsPrintModalOpen(false)} 
          godowns={godowns}
        />
      )}
      {isBulkUpdateModalOpen && (
        <BulkUpdateModal
          selectedItems={selectedItems}
          allItems={items}
          onClose={() => setIsBulkUpdateModalOpen(false)}
          onBulkUpdate={onBulkUpdateItem}
        />
      )}
      {itemToTransfer && (
        <TransferModal
          item={itemToTransfer}
          godowns={godowns}
          onClose={() => setItemToTransfer(null)}
          onUpdateItem={onUpdateItem}
        />
      )}
    </AnimatePresence>
    </div>
  );
};
