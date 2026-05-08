/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Package, Plus, FileDown, FileUp, Trash2, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onAddItem: () => void;
  onDeleteAll: () => void;
  onExportCSV: () => void;
  onImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onAddItem,
  onDeleteAll,
  onExportCSV,
  onImportCSV,
  onDownloadTemplate
}) => {
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1D1D1B] font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Package className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight leading-none mb-1">Dharmveer Inventory</h1>
              <p className="text-xs text-gray-400 font-medium tracking-wide">Track and manage your inventory</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4 mr-2">
              <HeaderButton icon={<FileDown className="w-4 h-4" />} label="CSV Template" onClick={onDownloadTemplate} />
              <div className="relative">
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={onImportCSV}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  title="Import CSV"
                />
                <HeaderButton icon={<FileUp className="w-4 h-4" />} label="Import CSV" onClick={() => {}} />
              </div>
              <HeaderButton icon={<FileDown className="w-4 h-4" />} label="Export CSV" onClick={onExportCSV} />
            </div>

            <button 
              onClick={onAddItem}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>

            <button 
              onClick={onDeleteAll}
              className="flex items-center gap-2 text-red-500 border border-red-100 bg-red-50 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete All
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-8">
        {children}
      </main>
    </div>
  );
};

const HeaderButton = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium border border-gray-100 transition-colors"
  >
    {icon}
    {label}
  </button>
);

