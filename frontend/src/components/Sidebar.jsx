import { CalendarDays, ChevronDown, LayoutDashboard, LogOut, Receipt, Settings } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

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
        {/* Gradiente ciano → azul → roxo profundo */}
        <linearGradient id={`${id}g`} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#52D4FF" />
          <stop offset="42%"  stopColor="#5058FF" />
          <stop offset="100%" stopColor="#7B12FF" />
        </linearGradient>

        {/* Sombra de profundidade (canto inferior direito) */}
        <radialGradient id={`${id}d`} cx="70%" cy="70%" r="55%">
          <stop offset="0%"   stopColor="#080035" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#080035" stopOpacity="0" />
        </radialGradient>

        {/* Brilho glass (topo) */}
        <linearGradient id={`${id}s`} x1="50" y1="10" x2="50" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.58" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>

        {/* Forma "+" com braços finos em cápsula */}
        <clipPath id={`${id}c`}>
          <rect x="38" y="10" width="24" height="80" rx="12" />
          <rect x="10" y="38" width="80" height="24" rx="12" />
        </clipPath>
      </defs>

      {/* Glow neon atrás do símbolo */}
      <rect x="38" y="10" width="24" height="80" rx="12"
        fill={`rgba(60,100,255,${glowOp})`}
        style={{ filter: `blur(${blur}px)` }} />
      <rect x="10" y="38" width="80" height="24" rx="12"
        fill={`rgba(60,100,255,${glowOp})`}
        style={{ filter: `blur(${blur}px)` }} />

      {/* Símbolo "+" preenchido */}
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
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isAdmin = user?.perfil === 'admin';

  return (
    <aside className="sidebar">
      <Brand />

      <nav className="side-nav" aria-label="Menu principal">
        <NavLink to="/dashboard" className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/atendimentos" className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
          <CalendarDays size={18} />
          <span>Atendimentos</span>
        </NavLink>

        <NavLink to="/despesas" className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
          <Receipt size={18} />
          <span>Despesas</span>
        </NavLink>

        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
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

      <div className="user-card">
        <div className="avatar">{getInitials(user?.nome)}</div>
        <div className="user-card-info">
          <strong>{user?.nome || '—'}</strong>
          <small>{isAdmin ? 'Administrador' : user?.especialidade || 'Profissional'}</small>
        </div>
        <ChevronDown size={15} color="var(--text-light)" />
      </div>
    </aside>
  );
}
