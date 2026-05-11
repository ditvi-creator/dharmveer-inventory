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
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:h-18 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex shrink-0 items-center justify-center shadow-sm">
              <Package className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg sm:text-xl tracking-tight leading-none mb-1 text-gray-900">Dharmveer Inventory</h1>
              <p className="text-xs text-gray-500 font-medium tracking-wide">Track and manage your inventory</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex flex-wrap items-center gap-2 border-r-0 border-b sm:border-b-0 sm:border-r border-gray-200 pb-3 sm:pb-0 sm:pr-4 sm:mr-2 w-full sm:w-auto">
              <HeaderButton icon={<FileDown className="w-4 h-4" />} label="Download Template" onClick={onDownloadTemplate} />
              <div className="relative">
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={onImportCSV}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  title="Import CSV"
                  aria-label="Import CSV"
                />
                <HeaderButton icon={<FileUp className="w-4 h-4" />} label="Import" onClick={() => {}} />
              </div>
              <HeaderButton icon={<FileDown className="w-4 h-4" />} label="Export" onClick={onExportCSV} />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={onAddItem}
                title="Shortcut: Ctrl+I"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>

              <button 
                onClick={onDeleteAll}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-red-500 border border-red-100 bg-red-50 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-4 sm:p-8">
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

