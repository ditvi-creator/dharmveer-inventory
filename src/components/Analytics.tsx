import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { StockItem } from '../types';
import { TrendingUp, Package, Calendar } from 'lucide-react';

interface AnalyticsProps {
  items: StockItem[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ items }) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');

  const data = useMemo(() => {
    const item = items.find(i => i.id === selectedItemId);
    if (!item) return [];

    let currentBalance = item.openingStockMP + item.openingStockKL;
    
    // Sort movements chronologically
    const movements = [...(item.movements || [])].sort((a, b) => a.date - b.date);
    
    const chartData = [
      {
        date: 'Opening',
        timestamp: 0,
        in: 0,
        out: 0,
        balance: currentBalance,
      }
    ];

    movements.forEach(m => {
      const isOut = m.type === 'OUT';
      if (isOut) {
        currentBalance -= m.qty;
      } else {
        currentBalance += m.qty;
      }

      chartData.push({
        date: new Date(m.date).toLocaleDateString(),
        timestamp: m.date,
        in: isOut ? 0 : m.qty,
        out: isOut ? m.qty : 0,
        balance: currentBalance
      });
    });

    return chartData;
  }, [items, selectedItemId]);

  return (
    <div className="max-w-6xl mx-auto mt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Visualize your stock movements over time.</p>
          </div>
        </div>
        
        {items.length > 0 && (
          <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 shadow-sm">
            <Package className="w-4 h-4 text-gray-400 dark:text-gray-400 mr-2" />
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="bg-transparent border-none outline-none font-medium text-gray-700 dark:text-gray-200 text-sm focus:ring-0 max-w-[200px] truncate"
            >
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!items.length ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center flex flex-col items-center">
          <TrendingUp className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Items Available</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">Add some items to your inventory to start viewing analytics.</p>
        </div>
      ) : !data.length || data.length === 1 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center flex flex-col items-center">
          <Calendar className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Stock Movements</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">There are no recorded stock movements for the selected item yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Current Balance</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{data[data.length - 1].balance}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Total Stock In</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {data.reduce((sum, d) => sum + d.in, 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Total Stock Out</h3>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {data.reduce((sum, d) => sum + d.out, 0)}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 font-sans">Stock Balance Over Time</h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Line 
                    type="stepAfter" 
                    dataKey="balance" 
                    name="Stock Balance"
                    stroke="#2563eb" 
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="in" 
                    name="Stock In"
                    stroke="#16a34a" 
                    strokeWidth={2}
                    dot={{ fill: '#16a34a', r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="out" 
                    name="Stock Out"
                    stroke="#f97316" 
                    strokeWidth={2}
                    dot={{ fill: '#f97316', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 font-sans">Stock Movements Detail</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.filter(d => d.timestamp > 0)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="in" name="Stock In" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="out" name="Stock Out" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
