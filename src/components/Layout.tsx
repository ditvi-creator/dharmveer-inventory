/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Package, Plus, FileDown, FileUp, Trash2, LogOut, LayoutDashboard, Settings, LineChart, Sun, Moon, Monitor, User } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useSettingsContext } from '../SettingsContext';

interface LayoutProps {
  children: React.ReactNode;
  onAddItem: () => void;
  onDeleteAll: () => void;
  onExportCSV: () => void;
  onImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
  currentPage: 'dashboard' | 'settings' | 'analytics' | 'profile';
  onPageChange: (page: 'dashboard' | 'settings' | 'analytics' | 'profile') => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onAddItem,
  onDeleteAll,
  onExportCSV,
  onImportCSV,
  onDownloadTemplate,
  currentPage,
  onPageChange
}) => {
  const { theme, setTheme } = useTheme();
  const { settings } = useSettingsContext();

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-gray-950 text-[#1D1D1B] dark:text-gray-100 font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 transition-colors duration-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="py-4 sm:h-18 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex shrink-0 items-center justify-center shadow-sm">
                  <Package className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-bold text-lg sm:text-xl tracking-tight leading-none mb-1 text-gray-900 dark:text-white">{settings.companyName}</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">Track and manage your inventory</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="hidden md:flex items-center space-x-1 bg-gray-50 dark:bg-gray-800 p-1 rounded-lg border border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => onPageChange('dashboard')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'dashboard' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50'}`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => onPageChange('analytics')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'analytics' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50'}`}
                >
                  <LineChart className="w-4 h-4" />
                  Analytics
                </button>
                <button
                  onClick={() => onPageChange('settings')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'settings' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50'}`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={() => onPageChange('profile')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'profile' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50'}`}
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {currentPage === 'dashboard' && (
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
              )}

              {currentPage === 'dashboard' && (
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
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile Bottom Nav */}
          <div className="md:hidden border-t border-gray-100 dark:border-gray-800 flex items-center p-2 bg-gray-50/50 dark:bg-gray-800/50">
            <button
              onClick={() => onPageChange('dashboard')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors ${currentPage === 'dashboard' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-700' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => onPageChange('analytics')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors ${currentPage === 'analytics' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-700' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'}`}
            >
              <LineChart className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={() => onPageChange('settings')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors ${currentPage === 'settings' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-700' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'}`}
            >
              <Settings className="w-4 h-4 hidden sm:block" />
              Settings
            </button>
            <button
              onClick={() => onPageChange('profile')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors ${currentPage === 'profile' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-700' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'}`}
            >
              <User className="w-4 h-4 hidden sm:block" />
              Profile
            </button>
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
    className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-medium border border-gray-100 dark:border-gray-800 transition-colors"
  >
    {icon}
    {label}
  </button>
);

