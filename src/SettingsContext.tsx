import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AppSettings {
  companyName: string;
  itemsPerPage: string;
  defaultExportFormat: string;
  enableEmailNotifications: boolean;
  globalLowStockThreshold: string;
  preferredReminderTime: string;
  challanPrefix: string;
  challanTerms: string;
  challanFooter: string;
  challanPrintTerms: boolean;
  challanPrintFooter: boolean;
  challanShowSignature: boolean;
  themeColor: string;
  showProductImages: boolean;
}

export const defaultSettings: AppSettings = {
  companyName: 'Stockify',
  itemsPerPage: '10',
  defaultExportFormat: 'excel',
  enableEmailNotifications: true,
  globalLowStockThreshold: '10',
  preferredReminderTime: '09:00',
  challanPrefix: 'CHL-',
  challanTerms: '1. Goods once sold will not be taken back.\n2. Interest @18% p.a. will be charged if payment is not made within the stipulated time.\n3. Subject to local jurisdiction.',
  challanFooter: 'Thank you for your business!',
  challanPrintTerms: true,
  challanPrintFooter: true,
  challanShowSignature: true,
  themeColor: 'blue',
  showProductImages: true,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const themePalettes: Record<string, Record<string, string>> = {
  blue: {
    '50': '#eff6ff',
    '100': '#dbeafe',
    '200': '#bfdbfe',
    '300': '#93c5fd',
    '400': '#60a5fa',
    '500': '#3b82f6',
    '600': '#2563eb',
    '700': '#1d4ed8',
    '800': '#1e40af',
    '900': '#1e3a8a',
    '950': '#172554',
  },
  green: {
    '50': '#f0fdf4',
    '100': '#dcfce3',
    '200': '#bbf7d0',
    '300': '#86efac',
    '400': '#4ade80',
    '500': '#22c55e',
    '600': '#16a34a',
    '700': '#15803d',
    '800': '#166534',
    '900': '#14532d',
    '950': '#052e16'
  },
  purple: {
    '50': '#faf5ff',
    '100': '#f3e8ff',
    '200': '#e9d5ff',
    '300': '#d8b4fe',
    '400': '#c084fc',
    '500': '#a855f7',
    '600': '#9333ea',
    '700': '#7e22ce',
    '800': '#6b21a8',
    '900': '#581c87',
    '950': '#3b0764'
  },
  rose: {
    '50': '#fff1f2',
    '100': '#ffe4e6',
    '200': '#fecdd3',
    '300': '#fda4af',
    '400': '#fb7185',
    '500': '#f43f5e',
    '600': '#e11d48',
    '700': '#be123c',
    '800': '#9f1239',
    '900': '#881337',
    '950': '#4c0519'
  },
  amber: {
    '50': '#fffbeb',
    '100': '#fef3c7',
    '200': '#fde68a',
    '300': '#fcd34d',
    '400': '#fbbf24',
    '500': '#f59e0b',
    '600': '#d97706',
    '700': '#b45309',
    '800': '#92400e',
    '900': '#78350f',
    '950': '#451a03'
  }
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app-settings-config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.companyName === 'Pro Inventory') {
          parsed.companyName = 'Stockify';
        }
        return { ...defaultSettings, ...parsed };
      } catch (e) {
        // ignore
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    const root = document.documentElement;
    const palette = themePalettes[settings.themeColor] || themePalettes.blue;
    Object.entries(palette).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
  }, [settings.themeColor]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('app-settings-config', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};
