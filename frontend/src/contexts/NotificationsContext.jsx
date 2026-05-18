import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const NotificationsContext = createContext(null);

/* ── Notificações iniciais do admin (geradas pelo sistema) ── */
const ADMIN_INITIAL = [
  { id: 1, tipo: 'pendente', lida: false, texto: 'Rafael Martins aguarda aprovação de cadastro.',  tempo: '5 min atrás'  },
  { id: 2, tipo: 'pendente', lida: false, texto: 'João Souza aguarda aprovação de cadastro.',       tempo: '12 min atrás' },
  { id: 3, tipo: 'cadastro', lida: false, texto: 'Rafael Ferreira solicitou acesso ao sistema.',    tempo: '1 hora atrás' },
];

/* Notificações dos usuários (enviadas pelo admin) */
const USER_INITIAL = {};

export function NotificationsProvider({ children }) {
  const [adminNotifs, setAdminNotifs] = useState(ADMIN_INITIAL);
  const [userNotifs,  setUserNotifs]  = useState(USER_INITIAL);

  /* ── Admin: marca lidas ── */
  const markAdminAll = useCallback(() =>
    setAdminNotifs(prev => prev.map(n => ({ ...n, lida: true }))), []);

  const markAdminOne = useCallback((id) =>
    setAdminNotifs(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n)), []);

  /* ── Admin: adiciona notificação automática do sistema ── */
  const addAdminNotif = useCallback((texto, tipo = 'sistema') => {
    setAdminNotifs(prev => [{
      id: Date.now(), tipo, lida: false, texto,
      tempo: 'agora'
    }, ...prev]);
  }, []);

  /* ── Admin envia notificação para usuário específico ── */
  const sendToUser = useCallback((userId, texto) => {
    setUserNotifs(prev => ({
      ...prev,
      [userId]: [
        { id: Date.now(), lida: false, texto, tempo: 'agora', tipo: 'admin' },
        ...(prev[userId] || []),
      ],
    }));
  }, []);

  /* ── Admin envia notificação para TODOS os usuários ── */
  const sendToAll = useCallback((userIds, texto) => {
    setUserNotifs(prev => {
      const next = { ...prev };
      userIds.forEach(uid => {
        next[uid] = [
          { id: Date.now() + uid, lida: false, texto, tempo: 'agora', tipo: 'admin' },
          ...(prev[uid] || []),
        ];
      });
      return next;
    });
  }, []);

  /* ── Usuário: marca lidas ── */
  const markUserAll = useCallback((userId) =>
    setUserNotifs(prev => ({
      ...prev,
      [userId]: (prev[userId] || []).map(n => ({ ...n, lida: true })),
    })), []);

  const markUserOne = useCallback((userId, notifId) =>
    setUserNotifs(prev => ({
      ...prev,
      [userId]: (prev[userId] || []).map(n => n.id === notifId ? { ...n, lida: true } : n),
    })), []);

  const value = useMemo(() => ({
    adminNotifs, userNotifs,
    markAdminAll, markAdminOne, addAdminNotif,
    sendToUser, sendToAll,
    markUserAll, markUserOne,
    getUserNotifs: (uid) => userNotifs[uid] || [],
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
