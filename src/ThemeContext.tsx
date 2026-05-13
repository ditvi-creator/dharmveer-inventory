import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeType = 'light' | 'dark' | 'system' | 'auto';

interface ThemeState {
  theme: ThemeType;
  lightModeTime: string; // "07:00"
  darkModeTime: string; // "19:00"
}

interface ThemeContextType extends ThemeState {
  setTheme: (theme: ThemeType) => void;
  setLightModeTime: (time: string) => void;
  setDarkModeTime: (time: string) => void;
}

const defaultState: ThemeState = {
  theme: 'system',
  lightModeTime: '07:00',
  darkModeTime: '19:00',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ThemeState>(() => {
    const saved = localStorage.getItem('theme-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return defaultState;
  });

  const saveState = (newState: Partial<ThemeState>) => {
    setState(prev => {
      const updated = { ...prev, ...newState };
      localStorage.setItem('theme-settings', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const applyTheme = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      let currentMode: 'light' | 'dark' = 'light';

      if (state.theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        currentMode = systemPrefersDark ? 'dark' : 'light';
      } else if (state.theme === 'auto') {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTime = currentHours * 60 + currentMinutes;

        const parseTime = (timeStr: string) => {
          const [h, m] = timeStr.split(':').map(Number);
          return h * 60 + m;
        };

        const lightTime = parseTime(state.lightModeTime);
        const darkTime = parseTime(state.darkModeTime);

        if (lightTime < darkTime) {
          if (currentTime >= lightTime && currentTime < darkTime) {
            currentMode = 'light';
          } else {
            currentMode = 'dark';
          }
        } else {
          // e.g. Light: 07:00, Dark: 01:00 (next day)
          if (currentTime >= lightTime || currentTime < darkTime) {
            currentMode = 'light';
          } else {
            currentMode = 'dark';
          }
        }
      } else {
        currentMode = state.theme;
      }

      root.classList.add(currentMode);
    };

    applyTheme();

    // Set an interval to re-evaluate for 'auto' mode
    let interval: NodeJS.Timeout | null = null;
    if (state.theme === 'auto') {
      interval = setInterval(applyTheme, 60000); // every minute
    }

    const mediaQueryListener = (e: MediaQueryListEvent) => {
      if (state.theme === 'system') {
        applyTheme();
      }
    };
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', mediaQueryListener);

    return () => {
      if (interval) clearInterval(interval);
      mediaQuery.removeEventListener('change', mediaQueryListener);
    };
  }, [state.theme, state.lightModeTime, state.darkModeTime]);

  return (
    <ThemeContext.Provider
      value={{
        ...state,
        setTheme: (theme) => saveState({ theme }),
        setLightModeTime: (time) => saveState({ lightModeTime: time }),
        setDarkModeTime: (time) => saveState({ darkModeTime: time }),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
