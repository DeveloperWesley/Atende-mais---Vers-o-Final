import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const SettingsContext = createContext(null);
const uiKey = (userId) => `atende_ui_prefs_${userId || 'guest'}`;

const UI_DEFAULTS = {
  avatar:           null,
  confirmarExclusao: true,
};

function capitalizeName(name) {
  return (name || '').trim()
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, c => c.toUpperCase());
}

export function getDisplayName(nome, sexo) {
  const n = capitalizeName(nome);
  if (!n) return '—';
  if (sexo === 'Masculino') return `Dr. ${n}`;
  if (sexo === 'Feminino')  return `Dra. ${n}`;
  return n;
}

function loadUiPrefs(userId) {
  try {
    const saved = localStorage.getItem(uiKey(userId));
    return saved ? { ...UI_DEFAULTS, ...JSON.parse(saved) } : { ...UI_DEFAULTS };
  } catch { return { ...UI_DEFAULTS }; }
}

export function SettingsProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  /* Prefs de UI (localStorage) — escopadas por userId */
  const [uiPrefs, setUiPrefs] = useState(() => loadUiPrefs(null));

  /* Recarrega prefs quando o usuário muda (ex: logout → login outro usuário) */
  useEffect(() => {
    setUiPrefs(loadUiPrefs(user?.id));
  }, [user?.id]);

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

    // Salva prefs de UI no localStorage com chave do usuário
    if (Object.keys(uiUpdate).length > 0) {
      setUiPrefs(prev => {
        const next = { ...prev, ...uiUpdate };
        localStorage.setItem(uiKey(user?.id), JSON.stringify(next));
        return next;
      });
    }

    // Salva dados de perfil na API
    if (Object.keys(apiUpdate).length > 0 && isAuthenticated) {
      setPerfil(prev => ({ ...prev, ...apiUpdate }));
      api.atualizarPerfil(apiUpdate).catch(console.error);
    }
  }, [isAuthenticated]);

  /* Preview local de nome/sexo — atualiza displayName em tempo real sem esperar a API */
  const [preview, setPreview] = useState({ nome: null, sexo: null });

  const displayName = getDisplayName(
    preview.nome  ?? settings.nome,
    preview.sexo  ?? settings.sexo
  );

  /* Atualiza preview instantaneamente ao mudar nome ou sexo */
  const setDisplayPreview = useCallback((updates) => {
    setPreview(prev => ({ ...prev, ...updates }));
  }, []);

  /* avatar exposto diretamente para o Sidebar reagir imediatamente */
  const avatar = uiPrefs.avatar || null;

  return (
    <SettingsContext.Provider value={{ settings, saveSettings, displayName, avatar, setDisplayPreview }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
