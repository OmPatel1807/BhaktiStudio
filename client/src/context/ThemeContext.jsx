import React, { createContext, useContext, useState, useEffect } from 'react';
import { themeTokens } from '../theme/tokens';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('bhakti_studio_theme') || 'dark';
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('bhakti_studio_theme', theme);
    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }

    const tokens = isDark ? themeTokens.colors.dark : themeTokens.colors.light;

    root.style.setProperty('--bg-primary', tokens.background);
    root.style.setProperty('--bg-surface', tokens.surface);
    root.style.setProperty('--bg-surface-hover', tokens.surfaceHover);
    root.style.setProperty('--bg-input', tokens.input);
    root.style.setProperty('--text-primary', tokens.textPrimary);
    root.style.setProperty('--text-secondary', tokens.textSecondary);
    root.style.setProperty('--border-color', tokens.border);
    root.style.setProperty('--accent-gold', tokens.accentGold);
    root.style.setProperty('--accent-gold-hover', tokens.accentGoldHover);

    document.body.style.backgroundColor = tokens.background;
    document.body.style.color = tokens.textPrimary;
  }, [theme, isDark]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {/* Global CSS Theme Styles Injector for Minimal Elegant Warm Studio Theme */}
      <style>{`
        :root {
          --bg-primary: ${isDark ? '#0F172A' : '#FAF9F6'};
          --bg-surface: ${isDark ? '#1E293B' : '#F4EFE6'};
          --bg-surface-hover: ${isDark ? '#334155' : '#EBE4D8'};
          --bg-input: ${isDark ? '#0F172A' : '#EFEAE1'};
          --text-primary: ${isDark ? '#F8FAFC' : '#2B2B2B'};
          --text-secondary: ${isDark ? '#94A3B8' : '#66625D'};
          --border-color: ${isDark ? '#334155' : '#E6DFD5'};
          --accent-gold: ${isDark ? '#C97A13' : '#C39B5A'};
          --accent-gold-hover: ${isDark ? '#A35E07' : '#B28A49'};
        }
        html, body, #root {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          background-color: var(--bg-primary) !important;
          color: var(--text-primary) !important;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          transition: background-color 0.25s ease, color 0.25s ease;
        }
        input, select, textarea {
          background-color: var(--bg-input) !important;
          color: var(--text-primary) !important;
          border-color: var(--border-color) !important;
        }
        option {
          background-color: var(--bg-surface) !important;
          color: var(--text-primary) !important;
        }
      `}</style>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
