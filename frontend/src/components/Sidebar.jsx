import { BarChart2, CalendarDays, LayoutDashboard, LogOut, Receipt, Settings, Users, X } from 'lucide-react';
import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { useSidebar } from '../contexts/SidebarContext.jsx';

export function LogoMark({ size = 36, glow = false }) {
  const id = `lm${size}`;
  const blur = glow ? 14 : 9;
  const glowOp = glow ? 0.9 : 0.72;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ overflow: 'visible', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={`${id}g`} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#52D4FF" />
          <stop offset="42%"  stopColor="#5058FF" />
          <stop offset="100%" stopColor="#7B12FF" />
        </linearGradient>
        <radialGradient id={`${id}d`} cx="70%" cy="70%" r="55%">
          <stop offset="0%"   stopColor="#080035" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#080035" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}s`} x1="50" y1="10" x2="50" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.58" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}c`}>
          <rect x="38" y="10" width="24" height="80" rx="12" />
          <rect x="10" y="38" width="80" height="24" rx="12" />
        </clipPath>
      </defs>
      <rect x="38" y="10" width="24" height="80" rx="12"
        fill={`rgba(60,100,255,${glowOp})`}
        style={{ filter: `blur(${blur}px)` }} />
      <rect x="10" y="38" width="80" height="24" rx="12"
        fill={`rgba(60,100,255,${glowOp})`}
        style={{ filter: `blur(${blur}px)` }} />
      <g clipPath={`url(#${id}c)`}>
        <rect x="0" y="0" width="100" height="100" fill={`url(#${id}g)`} />
        <rect x="0" y="0" width="100" height="100" fill={`url(#${id}d)`} />
        <rect x="0" y="0" width="100" height="100" fill={`url(#${id}s)`} />
        <ellipse cx="43" cy="27" rx="14" ry="9"
          fill="rgba(255,255,255,0.35)"
          style={{ filter: 'blur(4px)' }} />
        <circle cx="37" cy="20" r="3" fill="rgba(255,255,255,0.82)" />
      </g>
    </svg>
  );
}

export function Brand({ size, glow = false }) {
  return (
    <div className="brand">
      <LogoMark size={size || 32} glow={glow} />
      <strong>Atende<span>+</span></strong>
    </div>
  );
}

function getInitials(nome = '') {
  const parts = nome.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Sidebar() {
  const { logout, user, impersonating } = useAuth();
  const { settings, displayName } = useSettings();
  const navigate = useNavigate();
  const { open, close } = useSidebar();

  const isAdmin = user?.perfil === 'admin';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  /* Fecha o drawer quando uma rota é selecionada no mobile */
  function handleNavClick() {
    close();
  }

  /* Bloqueia scroll do body quando drawer está aberto */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={`sidebar-overlay${open ? ' active' : ''}`}
        onClick={close}
        aria-hidden="true"
      />

      <aside className={`sidebar${open ? ' sidebar-open' : ''}`}>
        {/* Cabeçalho da sidebar */}
        <div className="sidebar-header">
          <Brand />
          <button className="sidebar-close-btn" onClick={close} aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>

        <nav className="side-nav" aria-label="Menu principal">
          <NavLink to="/dashboard" onClick={handleNavClick}
            className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/atendimentos" onClick={handleNavClick}
            className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
            <CalendarDays size={18} />
            <span>Atendimentos</span>
          </NavLink>

          <NavLink to="/despesas" onClick={handleNavClick}
            className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
            <Receipt size={18} />
            <span>Despesas</span>
          </NavLink>

          <NavLink to="/relatorios" onClick={handleNavClick}
            className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
            <BarChart2 size={18} />
            <span>Relatórios</span>
          </NavLink>

          <NavLink to="/pacientes" onClick={handleNavClick}
            className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
            <Users size={18} />
            <span>Pacientes</span>
          </NavLink>

          <NavLink to="/configuracoes" onClick={handleNavClick}
            className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
            <Settings size={18} />
            <span>Configurações</span>
          </NavLink>

          {isAdmin && (
            <NavLink to="/admin" onClick={handleNavClick}
              className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
              <Settings size={18} />
              <span>Administração</span>
            </NavLink>
          )}

          <div className="side-divider" />

          <button className="side-link" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </nav>

        <div className="user-card user-card-static">
          {!impersonating && settings.avatar
            ? <img src={settings.avatar} alt="Avatar" className="avatar avatar-img" />
            : <div className="avatar" style={impersonating ? { background: '#7c3aed' } : {}}>
                {getInitials(impersonating?.nome || settings.nome || user?.nome)}
              </div>
          }
          <div className="user-card-info">
            <strong>{impersonating ? impersonating.nome : displayName}</strong>
            <small>{impersonating ? impersonating.especialidade : (isAdmin ? 'Administrador' : settings.profissao || user?.especialidade || 'Profissional')}</small>
          </div>
        </div>
      </aside>
    </>
  );
}
