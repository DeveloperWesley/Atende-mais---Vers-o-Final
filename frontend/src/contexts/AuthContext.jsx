import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setImpersonateId } from '../services/api.js';

const AuthContext = createContext(null);

function loadStoredUser() {
  try {
    const stored = localStorage.getItem('atende_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);
  const [usuarios, setUsuarios] = useState([]);
  const [impersonating, setImpersonating] = useState(null);

  // Carrega lista de profissionais quando admin está logado
  useEffect(() => {
    if (user?.perfil === 'admin') {
      api.listarProfissionais().then(setUsuarios).catch(console.error);
    }
  }, [user?.id]);

  async function login({ email, senha }) {
    const { token, user: userData } = await api.login({ email, senha });
    localStorage.setItem('atende_token', token);
    localStorage.setItem('atende_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }

  async function registrar({ nome, email, senha, especialidade }) {
    await api.registrar({ nome, email, senha, especialidade });
  }

  function logout() {
    setImpersonateId(null);
    setUser(null);
    setImpersonating(null);
    localStorage.removeItem('atende_token');
    localStorage.removeItem('atende_user');
  }

  const aprovarUsuario = useCallback(async (id) => {
    await api.aprovarUsuario(id);
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'ativo' } : u)));
  }, []);

  const rejeitarUsuario = useCallback(async (id) => {
    await api.rejeitarUsuario(id);
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'inativo' } : u)));
  }, []);

  const desativarUsuario = useCallback(async (id) => {
    await api.desativarUsuario(id);
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'inativo' } : u)));
  }, []);

  const reativarUsuario = useCallback(async (id) => {
    await api.reativarUsuario(id);
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'ativo' } : u)));
  }, []);

  const startImpersonation = useCallback((profissional) => {
    setImpersonateId(profissional.id);
    setImpersonating(profissional);
  }, []);

  const stopImpersonation = useCallback(() => {
    setImpersonateId(null);
    setImpersonating(null);
  }, []);

  const effectiveUser = impersonating || user;

  const value = useMemo(
    () => ({
      user,
      usuarios,
      setUsuarios,
      effectiveUser,
      impersonating,
      login,
      logout,
      registrar,
      aprovarUsuario,
      rejeitarUsuario,
      desativarUsuario,
      reativarUsuario,
      startImpersonation,
      stopImpersonation,
      isAuthenticated: Boolean(user),
    }),
    [user, usuarios, impersonating]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return ctx;
}
