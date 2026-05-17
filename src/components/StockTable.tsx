import React, { useState } from 'react';
import { History, Plus, FileText, Bell, PenLine, Trash2, Printer, AlertTriangle } from 'lucide-react';
import { StockItem, Godown } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface StockTableProps {
  items: StockItem[];
  godowns?: Godown[]; // Added safely
  onEditItem: (item: StockItem) => void;
  onUpdateItem: (id: string, updates: Partial<StockItem>) => void;
  onDeleteItem: (id: string) => void;
  onOpenBookings: (item: StockItem) => void;
  onOpenHistory: (item: StockItem) => void;
  onOpenChallan: (item: StockItem, booking: any) => void;
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
  onDeleteItem, 
  onOpenBookings,
  onOpenHistory,
  onOpenChallan
}) => {
  const activeGodowns = godowns.length > 0 ? godowns : [{id: 'MP', name: 'MP'}, {id: 'KL', name: 'KL'}];
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            {/* ... table head ... */}
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12 border-r border-gray-100 dark:border-gray-800 italic">#</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800">Item Name</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800">Size</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800">Unit</th>
              <th colSpan={activeGodowns.length} className="px-4 py-2 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-r border-gray-100 dark:border-gray-800">Opening Stock</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800">Stock In</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800">Stock Out</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800">Balance</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800">Reorder Level</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800">Booked</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800">Party Name</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {activeGodowns.map(g => (
                <th key={g.id} className="px-4 py-2 text-center text-[15px] font-bold text-gray-400 dark:text-gray-400 uppercase border-r border-gray-100 dark:border-gray-800">{g.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <AnimatePresence>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={11 + activeGodowns.length} className="px-4 py-16 text-center text-gray-400 dark:text-gray-400 text-sm italic">
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
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group ${isLowStock ? 'bg-red-50 dark:bg-red-900/30' : ''}`}
                    >
                      <td className="px-4 py-4 text-xs text-gray-400 dark:text-gray-400 border-r border-gray-50 dark:border-gray-800/50 italic relative">
                        {index + 1}
                        {isLowStock && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-50 dark:bg-red-900/20"></div>
                        )}
                      </td>
                      <td className="px-4 py-4 border-r border-gray-50 dark:border-gray-800/50">
                        <div className="flex flex-col">
                          <span className="font-bold text-lg text-gray-900 dark:text-white">{item.name}</span>
                          {item.category && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.category}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-lg text-gray-600 dark:text-gray-300 border-r border-gray-50 dark:border-gray-800/50">
                        {item.size}
                      </td>
                      <td className="px-4 py-4 text-lg text-gray-500 dark:text-gray-400 border-r border-gray-50 dark:border-gray-800/50 uppercase">
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
                          <td key={g.id} className="px-2 py-4 text-sm text-center font-bold border-r border-gray-50 dark:border-gray-800/50">
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
                              className="w-16 text-center border border-transparent hover:border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 rounded py-1 px-1 text-lg bg-transparent font-bold transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                        );
                      })}
                      
                      <td className="px-2 py-4 text-sm text-center font-bold border-r border-gray-50 dark:border-gray-800/50">
                        <MovementInput 
                          currentTotal={item.stockIn || 0} 
                          onAdd={(val) => onUpdateItem(item.id, { stockIn: (item.stockIn || 0) + val })} 
                        />
                      </td>
                      <td className="px-2 py-4 text-sm text-center font-bold border-r border-gray-50 dark:border-gray-800/50">
                        <MovementInput 
                          currentTotal={item.stockOut || 0} 
                          onAdd={(val) => onUpdateItem(item.id, { stockOut: (item.stockOut || 0) + val })} 
                        />
                      </td>
                      <td className="px-4 py-4 border-r border-gray-50 dark:border-gray-800/50 text-center">
                        <div className={`inline-flex flex-col items-center justify-center ${
                            isLowStock 
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 shadow-[0_0_10px_rgba(220,38,38,0.2)]' 
                            : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                          } border rounded-lg w-[78px] h-[58px] relative`}
                        >
                          <span className="text-lg font-black">{item.balance}</span>
                          {isLowStock && (
                            <span className="text-[9px] uppercase font-bold text-red-500 tracking-wider flex items-center gap-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-lg text-center text-gray-500 dark:text-gray-400 border-r border-gray-50 dark:border-gray-800/50">
                        {item.reorderLevel}
                      </td>
                      <td className="px-4 py-4 text-lg text-center font-bold border-r border-gray-50 dark:border-gray-800/50">
                        {item.booked || 0}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 border-r border-gray-50 dark:border-gray-800/50 align-top">
                        {item.bookings && item.bookings.length > 0 ? (
                          <div className="flex flex-col gap-3 min-w-[200px]">
                            {item.bookings.map((booking, idx) => {
                              const scheduledDate = booking.dateOfSend ? new Date(booking.dateOfSend) : null;
                              
                              return (
                                <div key={booking.id} className="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                                  <div className="flex justify-between items-start mb-1.5 object-right text-[15px]">
                                    <span className="font-bold text-gray-800 dark:text-gray-200 leading-tight w-full break-normal text-left">{booking.partyName}</span>
                                    <div className="flex items-center ml-2 border dark:border-gray-700 bg-white dark:focus:bg-gray-800 pl-[3px] rounded">
                                      <span className="font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap text-xs">Qty:</span>
                                      <span className="text-[#2962d9] font-bold bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded text-[15px] whitespace-nowrap">
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
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 text-gray-400 dark:text-gray-400">
                          <button onClick={() => onOpenHistory(item)} className="p-1.5 text-gray-400 dark:text-gray-400 hover:text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:bg-blue-900/20 rounded-md transition-colors" title="View History">
                            <History className="w-4 h-4" />
                          </button>
                          <button onClick={() => onEditItem(item)} className="p-1.5 text-gray-400 dark:text-gray-400 hover:text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:bg-blue-900/20 rounded-md transition-colors" title="Edit Item">
                            <PenLine className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDeleteItem(item.id)} className="p-1.5 text-gray-400 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:bg-red-900/20 rounded-md transition-colors" title="Delete Item">
                            <Trash2 className="w-4 h-4" />
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

      {/* Mobile Card List */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
        <AnimatePresence>
          {items.length === 0 ? (
            <div className="px-4 py-16 text-center text-gray-400 dark:text-gray-400 text-sm italic">
              No records found. Click "Add Item" to begin.
            </div>
          ) : (
            items.map((item, index) => {
              const isLowStock = item.balance <= item.reorderLevel;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`p-4 ${isLowStock ? 'bg-red-50 dark:bg-red-900/30' : ''}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 italic">#{index + 1}</span>
                        <span className="font-bold text-lg text-gray-900 dark:text-white leading-tight">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 font-medium">{item.size}</span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 font-medium uppercase">{item.unit || 'BOX'}</span>
                        {item.category && <span className="text-xs text-gray-500">{item.category}</span>}
                      </div>
                    </div>
                    
                    <div className={`flex flex-col items-center justify-center ${
                        isLowStock 
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' 
                        : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                      } border rounded-lg px-3 py-1`}
                    >
                      <span className="text-sm font-black">{item.balance}</span>
                      <span className="text-[8px] uppercase font-bold tracking-wider">Balance</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                      <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Stock Movements</span>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <MovementInput 
                            currentTotal={item.stockIn || 0} 
                            onAdd={(val) => onUpdateItem(item.id, { stockIn: (item.stockIn || 0) + val })} 
                          />
                          <span className="text-[10px] text-center block text-green-600 font-bold">IN</span>
                        </div>
                        <div className="flex-1">
                          <MovementInput 
                            currentTotal={item.stockOut || 0} 
                            onAdd={(val) => onUpdateItem(item.id, { stockOut: (item.stockOut || 0) + val })} 
                          />
                          <span className="text-[10px] text-center block text-orange-600 font-bold">OUT</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center">
                       <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Threshold</span>
                       <div className="flex items-center gap-3">
                          <div className="text-center">
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 block">{item.reorderLevel}</span>
                            <span className="text-[8px] text-gray-400 uppercase">Min</span>
                          </div>
                          <div className="text-center">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block">{item.booked || 0}</span>
                            <span className="text-[8px] text-gray-400 uppercase">Book</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  {item.bookings && item.bookings.length > 0 ? (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Bookings ({item.bookings.length})</span>
                        <button onClick={() => onOpenBookings(item)} className="text-[10px] text-blue-600 font-bold">Manage</button>
                      </div>
                      <div className="space-y-2 overflow-x-auto flex flex-nowrap pb-2 gap-3 scrollbar-none">
                        {item.bookings.map((booking) => (
                          <div key={booking.id} className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 p-2 rounded-lg min-w-[140px] flex-shrink-0">
                            <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">{booking.partyName}</p>
                            <p className="text-[10px] text-blue-600 font-bold mt-1">Qty: {booking.qty}</p>
                            <button 
                              onClick={() => onOpenChallan(item, booking)}
                              className="mt-2 w-full py-1 bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900 text-[10px] text-blue-600 font-bold rounded flex items-center justify-center gap-1"
                            >
                              <Printer className="w-3 h-3" /> Challan
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-4 bg-gray-50 dark:bg-gray-800/30 p-2 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                      <span className="text-[10px] text-gray-400 italic">No active bookings</span>
                      <button onClick={() => onOpenBookings(item)} className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
                    <button onClick={() => onOpenHistory(item)} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 dark:text-gray-400 hover:text-blue-600 transition-colors">
                      <History className="w-3.5 h-3.5" /> History
                    </button>
                    <div className="flex items-center gap-3">
                      <button onClick={() => onEditItem(item)} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 dark:text-gray-400 hover:text-blue-600 transition-colors">
                        <PenLine className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => onDeleteItem(item.id)} className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
