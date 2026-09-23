import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('app_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  // Apply data-theme attribute on <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('app_theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Sync theme to DB for logged-in user (fire-and-forget, non-blocking)
  const syncThemeToDb = useCallback(async (newTheme) => {
    try {
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('userType');
      if (!token) return;

      if (userType === 'vendor') {
        await api.put('/auth/settings', { theme: newTheme, settings: { theme: newTheme } });
      } else {
        await api.patch('/customers/me', { preferences: { theme: newTheme } });
      }
    } catch (err) {
      console.error('Failed to sync theme to DB:', err?.message || err);
    }
  }, []);

  // Sync theme once when user profile loads from DB
  const syncUserTheme = useCallback((userObj) => {
    const savedTheme = userObj?.preferences?.theme || userObj?.vendorSettings?.theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, syncThemeToDb, syncUserTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
