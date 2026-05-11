/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StockItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, Save, X, Plus, Trash2, Printer, AlertCircle, History, Calendar, Clock, Bell, BellRing } from 'lucide-react';
import { Booking } from '../types';

interface StockTableProps {
  items: StockItem[];
  onEditItem: (item: StockItem) => void;
  onUpdateItem: (id: string, updates: Partial<StockItem>) => void;
  onDeleteItem: (id: string) => void;
  onOpenBookings: (item: StockItem) => void;
  onOpenChallan: (item: StockItem, booking: Booking) => void;
  onOpenHistory: (item: StockItem) => void;
}

export const StockTable: React.FC<StockTableProps> = ({ items, onEditItem, onUpdateItem, onDeleteItem, onOpenBookings, onOpenChallan, onOpenHistory }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-12 border-r border-gray-100 italic">#</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-100">Item Name</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100">Size</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100">Unit</th>
              <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100">Opening Stock</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100">Stock In</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100">Stock Out</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100">Balance</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100">Reorder Level</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100">Booked</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Party Name</th>
              <th rowSpan={2} className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2 text-center text-[15px] font-bold text-gray-400 uppercase border-r border-gray-100">MP</th>
              <th className="px-4 py-2 text-center text-[15px] font-bold text-gray-400 uppercase border-r border-gray-100">KL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <AnimatePresence>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-16 text-center text-gray-400 text-sm italic">
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
                      exit={{ opacity: 0 }}
                      className={`hover:bg-gray-50/50 transition-colors group ${isLowStock ? 'bg-red-50/20' : ''}`}
                    >
                      <td className="px-4 py-4 text-xs text-gray-400 border-r border-gray-50 italic relative">
                        {index + 1}
                        {isLowStock && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                        )}
                      </td>
                      <td className="px-4 py-4 border-r border-gray-50">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-gray-900">{item.name}</span>
                          {item.category && (
                            <span className="text-sm text-gray-500 mt-0.5">{item.category}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 border-r border-gray-50">
                        {item.size}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 border-r border-gray-50 uppercase">
                        {item.unit || 'BOX'}
                      </td>
                      
                      <td className="px-2 py-4 text-sm text-center font-bold border-r border-gray-50 bg-gray-50/30">
                        <input
                          type="number"
                          value={item.openingStockMP === 0 ? '' : item.openingStockMP}
                          onChange={(e) => onUpdateItem(item.id, { openingStockMP: e.target.value === '' ? 0 : Number(e.target.value) })}
                          placeholder="0"
                          className="w-16 text-center border border-transparent hover:border-gray-200 focus:border-blue-500 focus:bg-white rounded py-1 px-1 text-sm bg-transparent font-bold transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="px-2 py-4 text-sm text-center font-bold border-r border-gray-50">
                        <input
                          type="number"
                          value={item.openingStockKL === 0 ? '' : item.openingStockKL}
                          onChange={(e) => onUpdateItem(item.id, { openingStockKL: e.target.value === '' ? 0 : Number(e.target.value) })}
                          placeholder="0"
                          className="w-16 text-center border border-transparent hover:border-gray-200 focus:border-blue-500 focus:bg-white rounded py-1 px-1 text-sm bg-transparent font-bold transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      
                      <td className="px-2 py-4 text-sm text-center font-bold border-r border-gray-50">
                        <input
                          type="number"
                          value={item.stockIn === 0 ? '' : item.stockIn}
                          onChange={(e) => onUpdateItem(item.id, { stockIn: e.target.value === '' ? 0 : Number(e.target.value) })}
                          placeholder="0"
                          className="w-16 text-center border border-transparent hover:border-gray-200 focus:border-blue-500 focus:bg-white rounded py-1 px-1 text-sm bg-transparent font-bold transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      <td className="px-2 py-4 text-sm text-center font-bold border-r border-gray-50">
                        <input
                          type="number"
                          value={item.stockOut === 0 ? '' : item.stockOut}
                          onChange={(e) => onUpdateItem(item.id, { stockOut: e.target.value === '' ? 0 : Number(e.target.value) })}
                          placeholder="0"
                          className="w-16 text-center border border-transparent hover:border-gray-200 focus:border-blue-500 focus:bg-white rounded py-1 px-1 text-sm bg-transparent font-bold transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      <td className="px-4 py-4 border-r border-gray-50 text-center">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <span className={`inline-flex items-center justify-center w-12 h-7 rounded-sm text-sm font-bold border ${
                            isLowStock 
                            ? 'bg-red-50 text-red-600 border-red-200 shadow-[0_0_10px_rgba(220,38,38,0.2)]' 
                            : 'bg-green-50 text-green-600 border-green-200'
                          }`}>
                            {item.balance}
                          </span>
                          {isLowStock && (
                            <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider flex items-center gap-1 animate-pulse">
                              <AlertCircle className="w-3 h-3" />
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-center text-gray-500 border-r border-gray-50">
                        {item.reorderLevel}
                      </td>

                      <td className="px-4 py-4 text-sm text-center font-bold border-r border-gray-50">
                        {item.booked}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600 border-r border-gray-50 align-top">
                        <div className="flex items-start justify-between min-w-[200px]">
                          <div className="flex flex-col w-full">
                            {item.bookings && item.bookings.length > 0 ? (
                              <div className="space-y-2">
                                {item.bookings.map((booking) => (
                                  <div key={booking.id} className="text-xs bg-gray-50/80 p-2.5 rounded-lg border border-gray-100/80">
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-800 break-words text-[15px]">{booking.partyName || 'Unknown'}</span>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenChallan(item, booking);
                                          }}
                                          className="text-gray-400 hover:text-[#2962d9] transition-colors p-0.5"
                                          title="Print Delivery Challan"
                                        >
                                          <Printer className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const updatedBookings = item.bookings?.map(b => 
                                              b.id === booking.id ? { ...b, reminderActive: !b.reminderActive } : b
                                            ) || [];
                                            onUpdateItem(item.id, { bookings: updatedBookings });
                                          }}
                                          className={`${booking.reminderActive ? 'text-amber-500 hover:text-amber-600' : 'text-gray-400 hover:text-amber-500'} transition-colors p-0.5`}
                                          title={booking.reminderActive ? "Cancel Reminder" : "Set Reminder"}
                                        >
                                          {booking.reminderActive ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                                        </button>
                                      </div>
                                      <span className="text-[#2962d9] font-bold bg-blue-50 px-1.5 py-0.5 rounded text-[15px] whitespace-nowrap">
                                        Qty: {booking.qty}
                                      </span>
                                    </div>
                                    {booking.address && (
                                      <div className="text-gray-500 text-[14px] leading-snug break-words">{booking.address}</div>
                                    )}
                                    {booking.dateOfSend && (
                                      <div className="mt-2 pt-2 border-t border-gray-200/50 flex flex-col gap-1 text-[#6b7280] text-[12px]">
                                        <div className="flex items-center gap-1.5">
                                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                                          <span className="font-medium">Send Date & Time:</span>
                                        </div>
                                        <div className="text-gray-900 font-medium pl-5">
                                          {new Date(booking.dateOfSend).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                <button 
                                  onClick={() => onOpenBookings(item)}
                                  className="flex items-center justify-center gap-1 w-full text-[15px] font-semibold text-[#2962d9] hover:text-blue-800 py-1.5 bg-blue-50/50 hover:bg-blue-50 rounded-lg transition-colors mt-1"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Manage Bookings
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="truncate max-w-[120px] text-gray-400 italic">No bookings</span>
                                <button 
                                  onClick={() => onOpenBookings(item)}
                                  className="text-[#2962d9] hover:text-blue-800 p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="Add Bookings"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => onOpenHistory(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="View History">
                            <History className="w-4 h-4" />
                          </button>
                          <button onClick={() => onEditItem(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit Item">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDeleteItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete Item">
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
    </div>
  );
};
