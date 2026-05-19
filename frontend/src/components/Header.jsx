import { Bell, Check, ChevronDown, Menu, Moon, Plus, Sun, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNotifications } from '../contexts/NotificationsContext.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { useSidebar } from '../contexts/SidebarContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

const TIPO_COLOR = {
  pendente: 'var(--orange)',
  cadastro: 'var(--primary)',
  sistema:  'var(--blue)',
  admin:    'var(--primary)',
  info:     'var(--blue)',
};

function NotifPanel({ notifs, onMarkAll, onMarkOne }) {
  const naoLidas = notifs.filter(n => !n.lida).length;
  return (
    <div className="notif-panel surface-card">
      <div className="notif-panel-header">
        <div>
          <strong>Notificações</strong>
          {naoLidas > 0 && <span className="notif-count-badge">{naoLidas} nova{naoLidas > 1 ? 's' : ''}</span>}
        </div>
        <button className="notif-mark-all" onClick={onMarkAll} disabled={naoLidas === 0}>
          <Check size={13} /> Marcar todas como lidas
        </button>
      </div>
      <div className="notif-list">
        {notifs.length === 0 ? (
          <div className="notif-empty">
            <Bell size={32} strokeWidth={1.2} />
            <p>Nenhuma notificação</p>
            <span>Você está em dia com tudo!</span>
          </div>
        ) : (
          notifs.map(n => (
            <div key={n.id} className={`notif-item${n.lida ? ' notif-lida' : ''}`}>
              <span className="notif-dot" style={{ background: n.lida ? 'transparent' : (TIPO_COLOR[n.tipo] || 'var(--primary)') }} />
              <div className="notif-item-body">
                <p>{n.texto}</p>
                <small>{n.tempo}</small>
              </div>
              {!n.lida && (
                <button className="notif-item-close" title="Marcar como lida" onClick={() => onMarkOne(n.id)}>
                  <X size={12} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Header({ onNovoAtendimento, title, subtitle, actions }) {
  const { user, impersonating }   = useAuth();
  const { displayName, settings } = useSettings();
  const { theme, toggleTheme }    = useTheme();
  const { toggle }                = useSidebar();
  const {
    adminNotifs, markAdminAll, markAdminOne,
    getUserNotifs, markUserAll, markUserOne,
    refreshNotifs,
  } = useNotifications();

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  /* Seleciona notificações conforme perfil */
  const isAdmin      = user?.perfil === 'admin' && !impersonating;
  const effectiveUid = impersonating?.id ?? user?.id;
  const notifs       = isAdmin ? adminNotifs : getUserNotifs(effectiveUid);
  const markAll      = isAdmin ? markAdminAll  : () => markUserAll(effectiveUid);
  const markOne      = isAdmin ? markAdminOne  : (id) => markUserOne(effectiveUid, id);

  const naoLidas = notifs.filter(n => !n.lida).length;

  useEffect(() => {
    function handleOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    if (notifOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [notifOpen]);

  /* Nome e saudação — usa displayName já com Dr./Dra. e capitalizado */
  function capitalize(str) {
    return (str || '').trim().toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());
  }
  function getPrefix(sexo) {
    if (sexo === 'Masculino') return 'Dr.';
    if (sexo === 'Feminino')  return 'Dra.';
    return '';
  }

  let primeiroNome;
  if (impersonating) {
    const imp    = impersonating;
    const prefix = getPrefix(imp.sexo);
    const first  = capitalize(imp.nome).split(' ')[0];
    primeiroNome = prefix ? `${prefix} ${first}` : first;
  } else {
    /* displayName já tem "Dr. Wesley Melo" — pega até o segundo token */
    const parts = displayName.split(' ');
    const hasPrefix = parts[0] === 'Dr.' || parts[0] === 'Dra.';
    primeiroNome = hasPrefix ? `${parts[0]} ${parts[1] || ''}`.trim() : parts[0];
  }

  const displayTitle    = title    ?? `Olá, ${primeiroNome}!`;
  const displaySubtitle = subtitle ?? 'Aqui está o resumo financeiro do seu consultório.';

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <button className="hamburger-btn" onClick={toggle} aria-label="Abrir menu">
          <Menu size={22} />
        </button>
        <div className="top-bar-greeting">
          <h1>{displayTitle}</h1>
          <p>{displaySubtitle}</p>
        </div>
      </div>

      <div className="top-bar-actions">
        <button className="theme-control" onClick={toggleTheme}>
          {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
          <span className="theme-control-label">{theme === 'dark' ? 'Escuro' : 'Claro'}</span>
          <ChevronDown size={13} />
          <div className="toggle-switch" />
        </button>

        {/* Sino de notificações */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="notif-btn"
            aria-label="Notificações"
            onClick={() => { setNotifOpen(o => !o); refreshNotifs(); }}
          >
            <Bell size={18} />
            {naoLidas > 0 && <span className="notif-badge">{naoLidas}</span>}
          </button>

          {notifOpen && (
            <NotifPanel
              notifs={notifs}
              onMarkAll={markAll}
              onMarkOne={markOne}
              onClose={() => setNotifOpen(false)}
            />
          )}
        </div>

        {actions ?? (
          onNovoAtendimento && (
            <button className="btn btn-primary btn-md" onClick={onNovoAtendimento}>
              <Plus size={17} strokeWidth={2.5} />
              <span className="btn-label">Novo atendimento</span>
            </button>
          )
        )}
      </div>
    </header>
  );
}
