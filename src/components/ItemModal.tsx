/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PackagePlus, Save } from 'lucide-react';
import { StockItem } from '../types';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  itemToEdit?: StockItem | null;
  partyNames?: string[];
}

export const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, onSave, itemToEdit, partyNames = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    size: '',
    unit: 'BOX',
    openingStockMP: 0,
    openingStockKL: 0,
    reorderLevel: 0,
    partyName: '',
  });

  useEffect(() => {
    if (!isOpen) {
      // Clear form when closed
      setFormData({ 
        name: '', 
        size: '', 
        unit: 'BOX', 
        openingStockMP: 0, 
        openingStockKL: 0, 
        reorderLevel: 0, 
        partyName: '' 
      });
      return;
    }

    if (itemToEdit) {
      setFormData({
        name: itemToEdit.name || '',
        size: itemToEdit.size || '',
        unit: itemToEdit.unit || 'BOX',
        openingStockMP: itemToEdit.openingStockMP || 0,
        openingStockKL: itemToEdit.openingStockKL || 0,
        reorderLevel: itemToEdit.reorderLevel || 0,
        partyName: itemToEdit.partyName || '',
      });
    } else {
      setFormData({ 
        name: '', 
        size: '', 
        unit: 'BOX', 
        openingStockMP: 0, 
        openingStockKL: 0, 
        reorderLevel: 0, 
        partyName: '' 
      });
    }
  }, [itemToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    onSave(formData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                  {itemToEdit ? <Save className="w-6 h-6" /> : <PackagePlus className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{itemToEdit ? "Edit Stock Item" : "New Stock Item"}</h3>
                  <p className="text-xs text-gray-400">
                    {itemToEdit ? `Modifying properties for ${itemToEdit.name}` : "Add a new item to your inventory registry"}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Item Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    placeholder="e.g. country chest nut"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Size</label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    placeholder="e.g. 8*48"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  >
                    <option value="BOX">BOX</option>
                    <option value="PCS">PCS</option>
                    <option value="SET">SET</option>
                    <option value="KG">KG</option>
                  </select>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl md:col-span-2 grid grid-cols-2 gap-4 border border-blue-100">
                  <div className="col-span-2">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Opening Stock Values</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">MP Value</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.openingStockMP}
                      onChange={(e) => setFormData({ ...formData, openingStockMP: Number(e.target.value) })}
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">KL Value</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.openingStockKL}
                      onChange={(e) => setFormData({ ...formData, openingStockKL: Number(e.target.value) })}
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Party Name</label>
                  <input
                    type="text"
                    list="item-party-names"
                    value={formData.partyName}
                    onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    placeholder="e.g. Main Distributor"
                  />
                  <datalist id="item-party-names">
                    {partyNames.map((name, i) => (
                      <option key={i} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  {itemToEdit ? (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <PackagePlus className="w-5 h-5" />
                      Add to Inventory
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
