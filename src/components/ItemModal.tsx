import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PackagePlus, Save } from 'lucide-react';
import { Godown, StockItem } from '../types';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  itemToEdit?: StockItem | null;
  partyNames?: string[];
  godowns?: Godown[];
}

export const ItemModal: React.FC<ItemModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  itemToEdit, 
  partyNames = [], 
  godowns = [] 
}) => {
  const activeGodowns = godowns.length > 0 ? godowns : [{id: 'MP', name: 'MP'}, {id: 'KL', name: 'KL'}];

  const getDefaultFormData = () => ({
    name: '',
    size: '',
    unit: 'BOX',
    category: '',
    openingStockMP: 0,
    openingStockKL: 0,
    godownStocks: {},
    reorderLevel: 0,
    partyName: '',
  });

  const [formData, setFormData] = useState<any>(getDefaultFormData());

  useEffect(() => {
    if (!isOpen) {
      setFormData(getDefaultFormData());
      return;
    }

    if (itemToEdit) {
      setFormData({
        name: itemToEdit.name || '',
        size: itemToEdit.size || '',
        unit: itemToEdit.unit || 'BOX',
        category: itemToEdit.category || '',
        openingStockMP: itemToEdit.openingStockMP || 0,
        openingStockKL: itemToEdit.openingStockKL || 0,
        godownStocks: itemToEdit.godownStocks || {},
        reorderLevel: itemToEdit.reorderLevel || 0,
        partyName: itemToEdit.partyName || '',
      });
    } else {
      setFormData(getDefaultFormData());
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
                  transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden my-8"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                  {itemToEdit ? <Save className="w-6 h-6" /> : <PackagePlus className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{itemToEdit ? "Edit Stock Item" : "New Stock Item"}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-400">
                    {itemToEdit ? `Modifying properties for ${itemToEdit.name}` : "Add a new item to your inventory"}
                  </p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="p-2 hover:bg-gray-50 dark:bg-gray-900/50 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Item Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    placeholder="e.g. country chest nut"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Size</label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    placeholder="e.g. 8*48"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  >
                    <option value="BOX">BOX</option>
                    <option value="PCS">PCS</option>
                    <option value="SQFT">SQFT</option>
                    <option value="MTR">MTR</option>
                    <option value="KG">KG</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Category / Brand</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    placeholder="e.g. morgoon"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex flex-col gap-4 border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">Opening Stock</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {activeGodowns.map(g => {
                        let val = 0;
                        if (g.id === 'MP') val = formData.openingStockMP;
                        else if (g.id === 'KL') val = formData.openingStockKL;
                        else val = formData.godownStocks?.[g.id] || 0;

                        return (
                          <div key={g.id}>
                            <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">{g.name}</label>
                            <input
                              type="number"
                              value={val === 0 ? '' : val}
                              onChange={(e) => {
                                const num = e.target.value ? Number(e.target.value) : 0;
                                if (g.id === 'MP') setFormData({...formData, openingStockMP: num});
                                else if (g.id === 'KL') setFormData({...formData, openingStockKL: num});
                                else setFormData({...formData, godownStocks: {...formData.godownStocks, [g.id]: num}});
                              }}
                              className="w-full bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                              placeholder="0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Reorder Level</label>
                  <input
                    type="number"
                    value={formData.reorderLevel === 0 ? '' : formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value ? Number(e.target.value) : 0 })}
                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    placeholder="Alert threshold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Party Name</label>
                  <input
                    type="text"
                    list="partyNames"
                    value={formData.partyName}
                    onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    placeholder="e.g. radha marble"
                  />
                  <datalist id="partyNames">
                    {partyNames.map((name, idx) => (
                      <option key={idx} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:flex-1 px-6 py-3.5 sm:py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-[2] px-6 py-3.5 sm:py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {itemToEdit ? "Save Changes" : "Add to Inventory"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
