/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { StockTable } from './components/StockTable';
import { AddItemModal } from './components/AddItemModal';
import { StockItem } from './types';
import { Search, AlertTriangle, TrendingDown, TrendingUp, Boxes, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');

  // Load items on mount
  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const res = await fetch('/api/stock');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch stock', err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (data: any) => {
    const newItem = {
      ...data,
      stockIn: 0,
      stockOut: 0,
      booked: 0,
      balance: data.openingStockMP + data.openingStockKL
    };

    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      if (res.ok) fetchStock();
    } catch (err) {
      console.error('Failed to add item', err);
    }
  };

  const updateItem = async (id: string, updates: Partial<StockItem>) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Correctly merge updates
    const merged = { ...item, ...updates };
    // Recalculate balance
    const stockIn = merged.stockIn ?? 0;
    const stockOut = merged.stockOut ?? 0;
    const balance = (merged.openingStockMP + merged.openingStockKL + stockIn) - stockOut;

    try {
      const res = await fetch(`/api/stock/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, balance })
      });
      if (res.ok) fetchStock();
    } catch (err) {
      console.error('Failed to update item', err);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item permanently?')) return;
    try {
      const res = await fetch(`/api/stock/${id}`, { method: 'DELETE' });
      if (res.ok) fetchStock();
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  const deleteAllItems = async () => {
    if (!confirm('Are you sure you want to delete ALL inventory records? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/stock/all/clear', { method: 'DELETE' });
      if (res.ok) fetchStock();
    } catch (err) {
      console.error('Failed to delete all items', err);
    }
  };

  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (sortBy) {
      case 'name-asc': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'size-asc': result.sort((a, b) => a.size.localeCompare(b.size)); break;
      case 'size-desc': result.sort((a, b) => b.size.localeCompare(a.size)); break;
      case 'balance-asc': result.sort((a, b) => a.balance - b.balance); break;
      case 'balance-desc': result.sort((a, b) => b.balance - a.balance); break;
      case 'reorder-asc': result.sort((a, b) => a.reorderLevel - b.reorderLevel); break;
      case 'reorder-desc': result.sort((a, b) => b.reorderLevel - a.reorderLevel); break;
    }

    return result;
  }, [items, searchTerm, sortBy]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalStockIn = items.reduce((sum, item) => sum + item.stockIn, 0);
    const totalStockOut = items.reduce((sum, item) => sum + item.stockOut, 0);
    const lowStockItems = items.filter(item => item.balance <= item.reorderLevel).length;
    return { totalItems, totalStockIn, totalStockOut, lowStockItems };
  }, [items]);

  const downloadTemplate = () => {
    const headers = ['Item Name', 'Size', 'Unit', 'Opening Stock MP', 'Opening Stock KL', 'Reorder Level', 'Party Name'];
    const sampleRows = [
      ['Sample Item 1', '8*48', 'BOX', '10', '5', '2', 'Supplier A'],
      ['Sample Item 2', '2*4', 'BOX', '20', '10', '5', 'Supplier B'],
    ];
    const csvContent = [headers, ...sampleRows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "inventory_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCSV = () => {
    if (items.length === 0) {
      alert('No data to export');
      return;
    }
    const headers = ['Item Name', 'Size', 'Unit', 'Opening Stock MP', 'Opening Stock KL', 'Stock In', 'Stock Out', 'Balance', 'Reorder Level', 'Booked', 'Party Name', 'Last Updated'];
    const rows = items.map(item => [
      item.name,
      item.size,
      item.unit || 'BOX',
      item.openingStockMP,
      item.openingStockKL,
      item.stockIn,
      item.stockOut,
      item.balance,
      item.reorderLevel,
      item.booked,
      item.partyName || '',
      new Date(item.updatedAt).toLocaleString()
    ]);
    const csvContent = [headers, ...rows].map(e => e.map(field => `"${field}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
      
      const newItems = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const item: any = {};
        
        headers.forEach((header, index) => {
          const val = values[index];
          if (header.includes('item name') || header === 'name') item.name = val;
          else if (header.includes('size')) item.size = val;
          else if (header.includes('unit')) item.unit = val;
          else if (header.includes('mp')) item.openingStockMP = Number(val) || 0;
          else if (header.includes('kl')) item.openingStockKL = Number(val) || 0;
          else if (header.includes('reorder')) item.reorderLevel = Number(val) || 0;
          else if (header.includes('party')) item.partyName = val;
        });
        
        item.name = item.name || 'Unnamed Item';
        item.size = item.size || 'N/A';
        item.unit = item.unit || 'BOX';
        item.stockIn = 0;
        item.stockOut = 0;
        item.booked = 0;
        item.balance = (item.openingStockMP || 0) + (item.openingStockKL || 0);
        return item;
      });

      if (newItems.length > 0) {
        try {
          const res = await fetch('/api/stock/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItems)
          });
          if (res.ok) {
            alert(`Successfully imported ${newItems.length} items`);
            fetchStock();
          }
        } catch (err) {
          console.error('Bulk upload failed', err);
        }
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Catalog...</p>
      </div>
    );
  }

  return (
    <Layout 
      onAddItem={() => setIsModalOpen(true)}
      onDeleteAll={deleteAllItems}
      onDownloadTemplate={downloadTemplate}
      onImportCSV={handleImportCSV}
      onExportCSV={exportCSV}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatsCard 
          icon={<Boxes className="text-blue-500 w-5 h-5" />} 
          bg="bg-blue-100/50"
          label="TOTAL ITEMS" 
          value={stats.totalItems} 
          delay={0.1}
        />
        <StatsCard 
          icon={<TrendingUp className="text-green-500 w-5 h-5" />} 
          bg="bg-green-100/50"
          label="TOTAL STOCK IN" 
          value={stats.totalStockIn} 
          delay={0.2}
        />
        <StatsCard 
          icon={<TrendingDown className="text-orange-500 w-5 h-5" />} 
          bg="bg-orange-100/50"
          label="TOTAL STOCK OUT" 
          value={stats.totalStockOut} 
          delay={0.3}
        />
        <StatsCard 
          icon={<AlertTriangle className="text-red-500 w-5 h-5" />} 
          bg="bg-red-100/50"
          label="LOW STOCK" 
          value={stats.lowStockItems} 
          delay={0.4}
        />
      </div>

      {/* Filters & Search */}
      <div className="space-y-6 mb-8">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by item name, size or party..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">Sort by:</span>
          <SortPill active={sortBy === 'default'} onClick={() => setSortBy('default')}>Default</SortPill>
          <SortPill active={sortBy === 'name-asc'} onClick={() => setSortBy('name-asc')}>Name A&rarr;Z</SortPill>
          <SortPill active={sortBy === 'name-desc'} onClick={() => setSortBy('name-desc')}>Name Z&rarr;A</SortPill>
          <SortPill active={sortBy === 'size-asc'} onClick={() => setSortBy('size-asc')}>Size A&rarr;Z</SortPill>
          <SortPill active={sortBy === 'size-desc'} onClick={() => setSortBy('size-desc')}>Size Z&rarr;A</SortPill>
          <SortPill active={sortBy === 'balance-asc'} onClick={() => setSortBy('balance-asc')}>Balance &uarr;</SortPill>
          <SortPill active={sortBy === 'balance-desc'} onClick={() => setSortBy('balance-desc')}>Balance &darr;</SortPill>
          <SortPill active={sortBy === 'reorder-asc'} onClick={() => setSortBy('reorder-asc')}>Reorder Level &uarr;</SortPill>
          <SortPill active={sortBy === 'reorder-desc'} onClick={() => setSortBy('reorder-desc')}>Reorder Level &darr;</SortPill>
        </div>
      </div>

      <StockTable 
        items={filteredAndSortedItems} 
        onUpdateItem={updateItem}
        onDeleteItem={deleteItem}
      />

      <AddItemModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={addItem} 
      />
    </Layout>
  );
}

const StatsCard = ({ icon, label, value, bg, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-black text-gray-900 leading-none">{value}</p>
    </div>
  </motion.div>
);

const SortPill = ({ children, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all border ${
      active 
      ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
      : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
    }`}
  >
    {children}
  </button>
);

