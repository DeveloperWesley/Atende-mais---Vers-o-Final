import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

/* Versão do tema — incrementar aqui força reset em todos os browsers */
const THEME_VERSION = '2';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    /* Se a versão salva for antiga, ignora e usa o padrão 'dark' */
    const savedVersion = localStorage.getItem('theme_version');
    if (savedVersion !== THEME_VERSION) {
      localStorage.setItem('theme_version', THEME_VERSION);
      localStorage.setItem('theme', 'dark');
      return 'dark';
    }
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    localStorage.setItem('theme_version', THEME_VERSION);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  function changeTheme(nextTheme) {
    setTheme(nextTheme === 'dark' ? 'dark' : 'light');
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider.');
  return ctx;
}
