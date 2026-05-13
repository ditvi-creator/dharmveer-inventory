import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Palette, Database, Save, RotateCcw, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme, ThemeType } from '../ThemeContext';

interface SettingsProps {
  onClearData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClearData }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'appearance' | 'data' | 'challan'>('general');
  const { theme, setTheme, lightModeTime, setLightModeTime, darkModeTime, setDarkModeTime } = useTheme();

  // Mock state for notification settings
  const [reminderThreshold, setReminderThreshold] = useState('10');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Challan mock state
  const [challanPrefix, setChallanPrefix] = useState('CHL-');
  const [challanTerms, setChallanTerms] = useState('1. Goods once sold will not be taken back.\n2. Interest @18% p.a. will be charged if payment is not made within the stipulated time.\n3. Subject to local jurisdiction.');
  const [challanFooter, setChallanFooter] = useState('Thank you for your business!');
  const [challanShowSignature, setChallanShowSignature] = useState(true);

  const [customSound, setCustomSound] = useState<string | null>(() => {
    return localStorage.getItem('customReminderSound');
  });

  const handleSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('File size must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCustomSound(dataUrl);
        localStorage.setItem('customReminderSound', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSound = () => {
    setCustomSound(null);
    localStorage.removeItem('customReminderSound');
  };

  const handlePlayTestSound = () => {
    if (customSound) {
      const audio = new Audio(customSound);
      audio.play().catch(e => console.error('Failed to play sound', e));
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl dark:bg-blue-900/40">
            {activeTab === 'general' && <SettingsIcon className="w-6 h-6" />}
            {activeTab === 'notifications' && <Bell className="w-6 h-6" />}
            {activeTab === 'appearance' && <Palette className="w-6 h-6" />}
            {activeTab === 'data' && <Database className="w-6 h-6" />}
            {activeTab === 'challan' && <FileText className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{activeTab} Settings</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your application preferences and general settings.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="md:col-span-1 space-y-1">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-sm transition-all shadow-sm border ${
              activeTab === 'general' 
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-900/50 border-transparent shadow-none'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            General
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-sm transition-all shadow-sm border ${
              activeTab === 'notifications' 
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-900/50 border-transparent shadow-none'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
          <button 
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-sm transition-all shadow-sm border ${
              activeTab === 'appearance' 
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-900/50 border-transparent shadow-none'
            }`}
          >
            <Palette className="w-4 h-4" />
            Appearance
          </button>
          <button 
            onClick={() => setActiveTab('challan')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-sm transition-all shadow-sm border ${
              activeTab === 'challan' 
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-900/50 border-transparent shadow-none'
            }`}
          >
            <FileText className="w-4 h-4" />
            Challan & Print
          </button>
          <button 
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-sm transition-all shadow-sm border ${
              activeTab === 'data' 
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-900/50 border-transparent shadow-none'
            }`}
          >
            <Database className="w-4 h-4" />
            Data
          </button>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          <div className="flex-1">
            {activeTab === 'general' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                    <SettingsIcon className="w-5 h-5 text-gray-400 dark:text-gray-400" />
                    General Settings
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Basic configuration for the applet</p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Setting Item */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-gray-50 dark:border-gray-800/50">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Company Name</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">This name will appear on delivery challans and headers.</p>
                    </div>
                    <input 
                      type="text" 
                      defaultValue="Dharmveer Inventory"
                      className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-gray-700 dark:text-gray-200 outline-none w-full sm:w-64"
                    />
                  </div>

                  {/* Setting Item */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-gray-50 dark:border-gray-800/50">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Items Per Page</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Number of items to show in the stock table.</p>
                    </div>
                    <select className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-gray-700 dark:text-gray-200 outline-none w-full sm:w-64 cursor-pointer">
                      <option value="10">10 Items</option>
                      <option value="25">25 Items</option>
                      <option value="50">50 Items</option>
                      <option value="all">All Items</option>
                    </select>
                  </div>

                  {/* Setting Item */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-gray-50 dark:border-gray-800/50">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Default Export Format</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Format to use when downloading reports or templates.</p>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-lg w-full sm:w-64">
                      <button className="flex-1 bg-white dark:bg-gray-800 shadow-sm rounded-md py-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100">CSV</button>
                      <button className="flex-1 rounded-md py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200">JSON</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                    <Bell className="w-5 h-5 text-gray-400 dark:text-gray-400" />
                    Stock Reminders & Notifications
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure when and how you receive alerts.</p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Setting Item */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-gray-50 dark:border-gray-800/50">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Enable Email Notifications</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive reminders directly to your email inbox.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={emailNotifications} 
                        onChange={(e) => setEmailNotifications(e.target.checked)} 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Setting Item */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-gray-50 dark:border-gray-800/50">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Global Low Stock Threshold</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Default warning level when a specific item has no reorder level set.</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <input 
                        type="number" 
                        value={reminderThreshold}
                        onChange={(e) => setReminderThreshold(e.target.value)}
                        className="px-4 py-2 pr-12 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-gray-700 dark:text-gray-200 outline-none w-full"
                        min="0"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500 dark:text-gray-400 text-sm">
                        items
                      </div>
                    </div>
                  </div>

                  {/* Setting Item */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-gray-50 dark:border-gray-800/50">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Preferred Reminder Time</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">When should pending stock reminders be shown or sent?</p>
                    </div>
                    <input 
                      type="time" 
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-gray-700 dark:text-gray-200 outline-none w-full sm:w-64"
                    />
                  </div>

                  {/* Setting Item */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-gray-50 dark:border-gray-800/50">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Custom Reminder Sound</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Upload an MP3 file to use as the reminder sound effect.</p>
                      {customSound && (
                        <div className="mt-2 flex items-center gap-2">
                          <button 
                            onClick={handlePlayTestSound}
                            className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded font-bold hover:bg-blue-200 transition-colors"
                          >
                            Play Test Sound
                          </button>
                          <button 
                            onClick={handleRemoveSound}
                            className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-3 py-1.5 rounded font-bold hover:bg-red-100 dark:bg-red-900/40 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="relative w-full sm:w-64">
                      <input 
                        type="file" 
                        accept="audio/mpeg, audio/mp3"
                        onChange={handleSoundUpload}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:bg-blue-900/20 file:text-blue-600 dark:text-blue-400 hover:file:bg-blue-100 dark:bg-blue-900/40 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                    <Palette className="w-5 h-5 text-gray-400 dark:text-gray-400" />
                    Appearance Settings
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize how the application looks.</p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Setting Item */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-gray-50 dark:border-gray-800/50">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Theme Preference</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Choose between light, dark, system, or auto theme.</p>
                    </div>
                    <select 
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as ThemeType)}
                      className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-gray-700 dark:text-gray-200 outline-none w-full sm:w-64 cursor-pointer"
                    >
                      <option value="light">Light Mode</option>
                      <option value="dark">Dark Mode</option>
                      <option value="system">System Default</option>
                      <option value="auto">Auto (Schedule)</option>
                    </select>
                  </div>

                  {theme === 'auto' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Light Mode Time</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">When should light mode automatically activate?</p>
                        </div>
                        <input 
                          type="time" 
                          value={lightModeTime}
                          onChange={(e) => setLightModeTime(e.target.value)}
                          className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-gray-700 dark:text-gray-200 outline-none w-full sm:w-64"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Dark Mode Time</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">When should dark mode automatically activate?</p>
                        </div>
                        <input 
                          type="time" 
                          value={darkModeTime}
                          onChange={(e) => setDarkModeTime(e.target.value)}
                          className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-gray-700 dark:text-gray-200 outline-none w-full sm:w-64"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'data' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                    <Database className="w-5 h-5 text-gray-400 dark:text-gray-400" />
                    Data Management
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your database and backups.</p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Setting Item (Danger Zone) */}
                  <div className="mt-4 pt-4">
                    <h4 className="font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h4>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-red-100 dark:border-red-800">
                      <div>
                        <h5 className="font-medium text-red-900">Clear All Data</h5>
                        <p className="text-sm text-red-600 dark:text-red-400/80">Permanently remove all inventory, bookings, and history.</p>
                      </div>
                      <button 
                        onClick={onClearData}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm font-medium whitespace-nowrap"
                      >
                        Clear Database
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'challan' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                    <FileText className="w-5 h-5 text-gray-400 dark:text-gray-400" />
                    Challan & Print Settings
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your delivery challan template and print settings.</p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Setting Item */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 py-4 border-b border-gray-50 dark:border-gray-800/50">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Challan Prefix</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Custom prefix for your challan numbers.</p>
                    </div>
                    <input 
                      type="text" 
                      value={challanPrefix}
                      onChange={(e) => setChallanPrefix(e.target.value)}
                      className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-gray-700 dark:text-gray-200 outline-none w-full sm:w-64"
                      placeholder="e.g., CHL- or INV-"
                    />
                  </div>

                  {/* Setting Item */}
                  <div className="flex flex-col py-4 border-b border-gray-50 dark:border-gray-800/50 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Terms & Conditions</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Default terms that appear at the bottom of the challan.</p>
                    </div>
                    <textarea 
                      value={challanTerms}
                      onChange={(e) => setChallanTerms(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-gray-700 dark:text-gray-200 outline-none resize-none"
                    />
                  </div>

                  {/* Setting Item */}
                  <div className="flex flex-col py-4 border-b border-gray-50 dark:border-gray-800/50 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Footer Text / Thank You Message</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">A short message to display at the very bottom.</p>
                    </div>
                    <input 
                      type="text" 
                      value={challanFooter}
                      onChange={(e) => setChallanFooter(e.target.value)}
                      placeholder="e.g., Thank you for your business!"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-gray-700 dark:text-gray-200 outline-none"
                    />
                  </div>

                  {/* Setting Item */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-gray-50 dark:border-gray-800/50">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Show Authorized Signature</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Include a line for signature at the bottom of the challan.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={challanShowSignature} 
                        onChange={(e) => setChallanShowSignature(e.target.checked)} 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                </div>
              </motion.div>
            )}

          </div>
          
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3 mt-auto">
            <button className="px-4 py-2 flex items-center gap-2 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:bg-gray-800/80 rounded-lg transition-colors">
              <RotateCcw className="w-4 h-4" />
              Reset Defaults
            </button>
            <button className="px-5 py-2 flex items-center gap-2 bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm rounded-lg transition-colors">
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
