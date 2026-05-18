import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const SettingsContext = createContext(null);
const STORAGE_KEY = 'atende_settings';

const DEFAULTS = {
  nome: 'João Silva',
  sexo: 'Masculino',
  profissao: 'Psicólogo',
  conselho: '',
  telefone: '',
  email: 'joao@atende.com',
  avatar: null,
  confirmarExclusao: true,
};

export function getDisplayName(nome, sexo) {
  const n = (nome || '').trim();
  if (!n) return '—';
  if (sexo === 'Masculino') return `Dr. ${n}`;
  if (sexo === 'Feminino') return `Dra. ${n}`;
  return n;
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULTS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULTS;
  });

  const saveSettings = useCallback((updates) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const displayName = getDisplayName(settings.nome, settings.sexo);

  return (
    <SettingsContext.Provider value={{ settings, saveSettings, displayName }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
