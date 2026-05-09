/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { StockTable } from './components/StockTable';
import { ItemModal } from './components/ItemModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { BookingsModal } from './components/BookingsModal';
import { ChallanModal } from './components/ChallanModal';
import { StockItem, Booking } from './types';
import { Search, AlertTriangle, TrendingDown, TrendingUp, Boxes, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import Papa from 'papaparse';

export default function App() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<StockItem | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedItemForBookings, setSelectedItemForBookings] = useState<StockItem | null>(null);
  const [selectedChallanBooking, setSelectedChallanBooking] = useState<{item: StockItem, booking: Booking} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');

  const allPartyNames = useMemo(() => {
    const names = new Set<string>();
    items.forEach(item => {
      if (item.partyName) names.add(item.partyName);
      item.bookings?.forEach(b => {
        if (b.partyName) names.add(b.partyName);
      });
    });
    return Array.from(names).filter(Boolean).sort();
  }, [items]);

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

  const openAddModal = () => {
    setItemToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: StockItem) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };

  const handleSaveItem = async (data: any) => {
    if (itemToEdit) {
      await updateItem(itemToEdit.id, data);
    } else {
      await addItem(data);
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

    const finalUpdates = { ...updates, balance };

    // Optimistic update
    const previousItems = [...items];
    setItems(items.map(i => i.id === id ? { ...i, ...finalUpdates } : i));

    try {
      const res = await fetch(`/api/stock/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalUpdates)
      });
      if (!res.ok) {
        setItems(previousItems);
        alert('Failed to update item on server');
      }
    } catch (err) {
      console.error('Failed to update item', err);
      setItems(previousItems);
    }
  };

  const deleteItem = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    setItemToDelete(null);
    
    // Optimistic delete
    const previousItems = [...items];
    setItems(items.filter(i => i.id !== id));

    try {
      const res = await fetch(`/api/stock/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setItems(previousItems);
        alert('Failed to delete item from server');
      }
    } catch (err) {
      console.error('Failed to delete item', err);
      setItems(previousItems);
    }
  };

  const deleteAllItems = async () => {
    setIsDeleteAllModalOpen(false);
    
    // Optimistic delete all
    const previousItems = [...items];
    setItems([]);

    try {
      const res = await fetch('/api/stock', { method: 'DELETE' });
      if (!res.ok) {
        setItems(previousItems);
        alert('Failed to clear inventory on server');
      }
    } catch (err) {
      console.error('Failed to delete all items', err);
      setItems(previousItems);
    }
  };

  const saveBookings = async (id: string, bookings: Booking[]) => {
    const totalBooked = bookings.reduce((sum, b) => sum + (Number(b.qty) || 0), 0);
    await updateItem(id, { bookings, booked: totalBooked });
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

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const newItems = results.data.map((row: any) => {
          const item: any = {};
          
          // Use normalized keys for matching
          Object.keys(row).forEach(key => {
            const normalizedKey = key.toLowerCase().trim();
            const val = row[key];

            if (normalizedKey.includes('item name') || normalizedKey === 'name') item.name = val;
            else if (normalizedKey.includes('size')) item.size = val;
            else if (normalizedKey.includes('unit')) item.unit = val;
            else if (normalizedKey.includes('mp')) item.openingStockMP = Number(val) || 0;
            else if (normalizedKey.includes('kl')) item.openingStockKL = Number(val) || 0;
            else if (normalizedKey.includes('reorder')) item.reorderLevel = Number(val) || 0;
            else if (normalizedKey.includes('party')) item.partyName = val;
          });

          // Ensure defaults for missing values
          return {
            name: item.name || 'Unnamed Item',
            size: item.size || 'N/A',
            unit: item.unit || 'BOX',
            openingStockMP: item.openingStockMP || 0,
            openingStockKL: item.openingStockKL || 0,
            reorderLevel: item.reorderLevel || 0,
            partyName: item.partyName || '',
            stockIn: 0,
            stockOut: 0,
            booked: 0,
            balance: (item.openingStockMP || 0) + (item.openingStockKL || 0)
          };
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
            alert('Failed to import items. Please check the console for details.');
          }
        }
        event.target.value = '';
      },
      error: (error) => {
        console.error('CSV Parsing Error:', error);
        alert('Error parsing CSV file');
      }
    });
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
      onAddItem={openAddModal}
      onDeleteAll={() => setIsDeleteAllModalOpen(true)}
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
        onEditItem={openEditModal}
        onUpdateItem={updateItem}
        onDeleteItem={(id) => setItemToDelete(id)}
        onOpenBookings={(item) => setSelectedItemForBookings(item)}
        onOpenChallan={(item, booking) => setSelectedChallanBooking({ item, booking })}
      />

      <ItemModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setItemToEdit(null);
        }} 
        onSave={handleSaveItem} 
        itemToEdit={itemToEdit}
        partyNames={allPartyNames}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={deleteAllItems}
        title="Delete All Items?"
        description={`This will permanently delete all ${items.length} stock items. This action cannot be undone.`}
      />

      <DeleteConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={deleteItem}
        title="Delete Item?"
        description="This will permanently delete this stock item. This action cannot be undone."
      />

      <BookingsModal
        isOpen={!!selectedItemForBookings}
        onClose={() => setSelectedItemForBookings(null)}
        item={selectedItemForBookings}
        onSave={saveBookings}
        partyNames={allPartyNames}
      />

      <ChallanModal
        isOpen={!!selectedChallanBooking}
        onClose={() => setSelectedChallanBooking(null)}
        item={selectedChallanBooking?.item || null}
        booking={selectedChallanBooking?.booking || null}
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

