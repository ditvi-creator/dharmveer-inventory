/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StockItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, Save, X, Plus, Trash2 } from 'lucide-react';

interface StockTableProps {
  items: StockItem[];
  onUpdateItem: (id: string, updates: Partial<StockItem>) => void;
  onDeleteItem: (id: string) => void;
}

export const StockTable: React.FC<StockTableProps> = ({ items, onUpdateItem, onDeleteItem }) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValues, setEditValues] = React.useState<Partial<StockItem>>({});

  const startEditing = (item: StockItem) => {
    setEditingId(item.id);
    setEditValues({
      stockIn: item.stockIn,
      stockOut: item.stockOut,
      booked: item.booked,
      reorderLevel: item.reorderLevel,
      partyName: item.partyName,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleSave = (id: string) => {
    onUpdateItem(id, editValues);
    setEditingId(null);
  };

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
              <th className="px-4 py-2 text-center text-[10px] font-bold text-gray-400 uppercase border-r border-gray-100">MP</th>
              <th className="px-4 py-2 text-center text-[10px] font-bold text-gray-400 uppercase border-r border-gray-100">KL</th>
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
                  const isEditing = editingId === item.id;
                  const isLowStock = item.balance <= item.reorderLevel;

                  return (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-4 py-4 text-xs text-gray-400 border-r border-gray-50 italic">{index + 1}</td>
                      <td className="px-4 py-4 font-bold text-sm text-gray-900 border-r border-gray-50">{item.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 border-r border-gray-50">{item.size}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 border-r border-gray-50 uppercase">{item.unit || 'BOX'}</td>
                      
                      <td className="px-4 py-4 text-sm text-center font-bold border-r border-gray-50 bg-gray-50/30">{item.openingStockMP}</td>
                      <td className="px-4 py-4 text-sm text-center font-bold border-r border-gray-50">{item.openingStockKL}</td>
                      
                      <td className="px-4 py-4 text-sm text-center font-bold border-r border-gray-50">
                        {isEditing ? (
                          <input 
                            type="number"
                            value={editValues.stockIn}
                            onChange={(e) => setEditValues({ ...editValues, stockIn: Number(e.target.value) })}
                            className="w-full text-center border border-gray-200 rounded px-1 py-1 text-sm bg-white"
                          />
                        ) : (
                          item.stockIn
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm text-center font-bold border-r border-gray-50">
                        {isEditing ? (
                          <input 
                            type="number"
                            value={editValues.stockOut}
                            onChange={(e) => setEditValues({ ...editValues, stockOut: Number(e.target.value) })}
                            className="w-full text-center border border-gray-200 rounded px-1 py-1 text-sm bg-white"
                          />
                        ) : (
                          item.stockOut
                        )}
                      </td>

                      <td className="px-4 py-4 border-r border-gray-50 text-center">
                        <span className={`inline-flex items-center justify-center w-12 h-7 rounded-sm text-sm font-bold border ${
                          isLowStock 
                          ? 'bg-red-50 text-red-600 border-red-200' 
                          : 'bg-green-50 text-green-600 border-green-200'
                        }`}>
                          {item.balance}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-sm text-center text-gray-500 border-r border-gray-50">
                        {isEditing ? (
                          <input 
                            type="number"
                            value={editValues.reorderLevel}
                            onChange={(e) => setEditValues({ ...editValues, reorderLevel: Number(e.target.value) })}
                            className="w-full text-center border border-gray-200 rounded px-1 py-1 text-sm bg-white"
                          />
                        ) : (
                          item.reorderLevel
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm text-center font-bold border-r border-gray-50">
                        {isEditing ? (
                          <input 
                            type="number"
                            value={editValues.booked}
                            onChange={(e) => setEditValues({ ...editValues, booked: Number(e.target.value) })}
                            className="w-full text-center border border-gray-200 rounded px-1 py-1 text-sm bg-white"
                          />
                        ) : (
                          item.booked
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600 border-r border-gray-50">
                        <div className="flex items-center justify-between">
                          {isEditing ? (
                            <input 
                              type="text"
                              value={editValues.partyName}
                              onChange={(e) => setEditValues({ ...editValues, partyName: e.target.value })}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white"
                            />
                          ) : (
                            <>
                              <span className="truncate max-w-[120px]">{item.partyName || '---'}</span>
                              <button 
                                onClick={() => onUpdateItem(item.id, { stockIn: (item.stockIn || 0) + 1 })}
                                className="text-blue-500 hover:text-blue-700 p-1 ml-2 bg-blue-50 rounded transition-colors"
                                title="Quick +1 Stock In"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button onClick={() => handleSave(item.id)} className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100">
                                <Save className="w-4 h-4" />
                              </button>
                              <button onClick={cancelEditing} className="p-1.5 bg-gray-50 text-gray-400 rounded-md hover:bg-gray-100">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEditing(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => onDeleteItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
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
