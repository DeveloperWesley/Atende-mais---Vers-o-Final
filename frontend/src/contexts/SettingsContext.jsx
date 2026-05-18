import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const SettingsContext = createContext(null);
const UI_KEY = 'atende_ui_prefs'; // apenas preferências de UI (tema, confirmarExclusao, avatar)

const UI_DEFAULTS = {
  avatar:           null,
  confirmarExclusao: true,
};

export function getDisplayName(nome, sexo) {
  const n = (nome || '').trim();
  if (!n) return '—';
  if (sexo === 'Masculino') return `Dr. ${n}`;
  if (sexo === 'Feminino')  return `Dra. ${n}`;
  return n;
}

function loadUiPrefs() {
  try {
    const saved = localStorage.getItem(UI_KEY);
    return saved ? { ...UI_DEFAULTS, ...JSON.parse(saved) } : { ...UI_DEFAULTS };
  } catch { return { ...UI_DEFAULTS }; }
}

export function SettingsProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  /* Prefs de UI (localStorage) */
  const [uiPrefs, setUiPrefs] = useState(loadUiPrefs);

  /* Dados de perfil (API) */
  const [perfil, setPerfil] = useState({
    nome:      '',
    sexo:      'Não informar',
    profissao: '',
    conselho:  '',
    telefone:  '',
    email:     '',
  });

  /* Carrega perfil do usuário logado */
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    // Preenche com dados do token imediatamente
    setPerfil(prev => ({
      ...prev,
      nome:      user.nome  || '',
      email:     user.email || '',
      profissao: user.profissao || user.especialidade || '',
      sexo:      user.sexo  || 'Não informar',
      conselho:  user.conselho  || '',
      telefone:  user.telefone  || '',
    }));
    // Busca dados completos da API
    api.meuPerfil()
      .then(data => setPerfil(prev => ({ ...prev, ...data })))
      .catch(console.error);
  }, [isAuthenticated, user?.id]);

  const settings = {
    ...perfil,
    ...uiPrefs,
  };

  const saveSettings = useCallback(async (updates) => {
    const uiFields  = ['avatar', 'confirmarExclusao'];
    const apiFields = ['nome', 'sexo', 'profissao', 'conselho', 'telefone', 'email'];

    const uiUpdate  = {};
    const apiUpdate = {};

    Object.entries(updates).forEach(([k, v]) => {
      if (uiFields.includes(k))  uiUpdate[k]  = v;
      if (apiFields.includes(k)) apiUpdate[k] = v;
    });

    // Salva prefs de UI no localStorage
    if (Object.keys(uiUpdate).length > 0) {
      setUiPrefs(prev => {
        const next = { ...prev, ...uiUpdate };
        localStorage.setItem(UI_KEY, JSON.stringify(next));
        return next;
      });
    }

    // Salva dados de perfil na API
    if (Object.keys(apiUpdate).length > 0 && isAuthenticated) {
      setPerfil(prev => ({ ...prev, ...apiUpdate }));
      api.atualizarPerfil(apiUpdate).catch(console.error);
    }
  }, [isAuthenticated]);

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
