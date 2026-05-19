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

  /* Carrega notificações ao autenticar */
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (user.perfil === 'admin') {
      api.listarAdminNotificacoes()
        .then(data => setAdminNotifs(data || []))
        .catch(console.error);
    } else {
      api.listarNotificacoes()
        .then(data => setUserNotifs(prev => ({ ...prev, [user.id]: dedupeNotifs(data) })))
        .catch(console.error);
    }
  }, [isAuthenticated, user?.id]);

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
    getUserNotifs: (uid) => dedupeNotifs(userNotifs[uid] || []),
  }), [adminNotifs, userNotifs]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
