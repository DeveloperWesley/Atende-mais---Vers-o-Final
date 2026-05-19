import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const NotificationsContext = createContext(null);

function dedupeNotifs(notifs = []) {
  const seen = new Set();
  return notifs.filter((n) => {
    if (n.lida) return true;
    const key = n.texto;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function NotificationsProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [adminNotifs, setAdminNotifs] = useState([]);
  const [userNotifs,  setUserNotifs]  = useState({});

  /* Função de refresh exposta para o Header usar ao abrir o sino */
  const refreshNotifs = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    try {
      if (user.perfil === 'admin') {
        const data = await api.listarAdminNotificacoes();
        setAdminNotifs(data || []);
      } else {
        const data = await api.listarNotificacoes();
        setUserNotifs(prev => ({ ...prev, [user.id]: dedupeNotifs(data || []) }));
      }
    } catch (e) { console.error(e); }
  }, [isAuthenticated, user?.id]);

  /* Carrega notificações ao autenticar */
  useEffect(() => {
    refreshNotifs();
  }, [refreshNotifs]);

  /* Atualiza a cada 30 segundos enquanto logado */
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(refreshNotifs, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshNotifs]);

  /* ── Admin: marca lidas ── */
  const markAdminAll = useCallback(async () => {
    await api.marcarTodasAdminLidas().catch(console.error);
    setAdminNotifs(prev => prev.map(n => ({ ...n, lida: true })));
  }, []);

  const markAdminOne = useCallback(async (id) => {
    await api.marcarUmaAdminLida(id).catch(console.error);
    setAdminNotifs(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  }, []);

  /* ── Admin: adiciona notificação local (otimista) ── */
  const addAdminNotif = useCallback((texto, tipo = 'sistema') => {
    setAdminNotifs(prev => [{ id: Date.now(), tipo, lida: false, texto, tempo: 'agora' }, ...prev]);
  }, []);

  /* ── Admin envia notificação para usuário(s) ── */
  const sendToUser = useCallback(async (userId, texto) => {
    await api.enviarNotificacao({ userIds: [userId], texto }).catch(console.error);
    setUserNotifs(prev => ({
      ...prev,
      [userId]: dedupeNotifs([{ id: Date.now(), lida: false, texto, tempo: 'agora', tipo: 'admin' }, ...(prev[userId] || [])]),
    }));
  }, []);

  const sendToAll = useCallback(async (userIds, texto) => {
    await api.enviarNotificacao({ userIds, texto }).catch(console.error);
    setUserNotifs(prev => {
      const next = { ...prev };
      userIds.forEach(uid => {
        next[uid] = dedupeNotifs([{ id: Date.now() + uid, lida: false, texto, tempo: 'agora', tipo: 'admin' }, ...(prev[uid] || [])]);
      });
      return next;
    });
  }, []);

  /* ── Usuário: marca lidas ── */
  const markUserAll = useCallback(async (userId) => {
    await api.marcarTodasLidas().catch(console.error);
    setUserNotifs(prev => ({ ...prev, [userId]: (prev[userId] || []).map(n => ({ ...n, lida: true })) }));
  }, []);

  const markUserOne = useCallback(async (userId, notifId) => {
    await api.marcarUmaLida(notifId).catch(console.error);
    setUserNotifs(prev => ({
      ...prev,
      [userId]: (prev[userId] || []).map(n => n.id === notifId ? { ...n, lida: true } : n),
    }));
  }, []);

  const value = useMemo(() => ({
    adminNotifs,
    userNotifs,
    markAdminAll,
    markAdminOne,
    addAdminNotif,
    sendToUser,
    sendToAll,
    markUserAll,
    markUserOne,
    refreshNotifs,
    getUserNotifs: (uid) => dedupeNotifs(userNotifs[uid] || []),
  }), [adminNotifs, userNotifs, refreshNotifs]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
