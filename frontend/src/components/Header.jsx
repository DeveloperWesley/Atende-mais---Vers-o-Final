import { Bell, Check, ChevronDown, Menu, Moon, Plus, Sun, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { useSidebar } from '../contexts/SidebarContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

/* ── Notificações mock iniciais ── */
const MOCK_NOTIFS = [
  { id: 1, tipo: 'aprovacao', lida: false, texto: 'Rafael Martins aguarda aprovação de cadastro.',   tempo: '5 min atrás'   },
  { id: 2, tipo: 'aprovacao', lida: false, texto: 'João Souza aguarda aprovação de cadastro.',        tempo: '12 min atrás'  },
  { id: 3, tipo: 'sistema',   lida: false, texto: 'Rafael Ferreira solicitou acesso ao sistema.',     tempo: '1 hora atrás'  },
];

/* ── Painel de notificações ── */
function NotifPanel({ notifs, onMarkAll, onMarkOne, onClose }) {
  const naoLidas = notifs.filter(n => !n.lida).length;

  const TIPO_COLOR = {
    aprovacao: 'var(--orange)',
    sistema:   'var(--primary)',
    info:      'var(--blue)',
  };

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
              <span className="notif-dot" style={{ background: n.lida ? 'transparent' : TIPO_COLOR[n.tipo] || 'var(--primary)' }} />
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

  const [notifs,      setNotifs]      = useState(MOCK_NOTIFS);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const notifRef = useRef(null);

  /* Fecha ao clicar fora */
  useEffect(() => {
    function handleOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    if (notifOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [notifOpen]);

  function markAll()  { setNotifs(prev => prev.map(n => ({ ...n, lida: true }))); }
  function markOne(id){ setNotifs(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n)); }

  const naoLidas = notifs.filter(n => !n.lida).length;

  /* Nome e saudação */
  const effectiveName = impersonating ? impersonating.nome : displayName;
  const sexo          = impersonating ? null : settings?.sexo;
  const prefix        = sexo === 'Feminino' ? 'Dra.' : sexo === 'Masculino' ? 'Dr.' : '';
  const primeiroNome  = impersonating
    ? impersonating.nome.split(' ')[0]
    : (prefix
      ? `${prefix} ${effectiveName.replace(/^(Dr\.|Dra\.)\s*/i, '').split(' ')[0]}`
      : effectiveName.split(' ')[0]);

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
            onClick={() => setNotifOpen(o => !o)}
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
