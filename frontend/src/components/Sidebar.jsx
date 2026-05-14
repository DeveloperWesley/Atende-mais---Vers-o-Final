import { ChevronDown, LogOut, Home } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

function LogoMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 72 72" role="presentation" aria-hidden="true">
      <defs>
        <linearGradient id="mark-fill" x1="10" y1="12" x2="62" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#44dcff" />
          <stop offset="0.45" stopColor="#536bff" />
          <stop offset="1" stopColor="#a133ff" />
        </linearGradient>
        <linearGradient id="mark-stroke" x1="8" y1="8" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#89f1ff" />
          <stop offset="0.5" stopColor="#4362ff" />
          <stop offset="1" stopColor="#c63dff" />
        </linearGradient>
        <filter id="mark-glow" x="-45%" y="-45%" width="190%" height="190%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#4b6cff" floodOpacity="0.42" />
          <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#a733ff" floodOpacity="0.35" />
        </filter>
      </defs>
      <g filter="url(#mark-glow)" transform="rotate(8 36 36)">
        <path
          className="brand-mark-shape"
          d="M31.5 6h9c4.2 0 7.4 3.7 6.8 7.9l-2.1 14.2h14.9c4 0 7.2 3.2 7.2 7.2v7.5c0 4-3.2 7.2-7.2 7.2H45.2l2.1 14.2c0.6 4.2-2.6 7.9-6.8 7.9h-9c-4.2 0-7.4-3.7-6.8-7.9L26.8 50H11.9c-4 0-7.2-3.2-7.2-7.2v-7.5c0-4 3.2-7.2 7.2-7.2h14.9L24.7 13.9C24.1 9.7 27.3 6 31.5 6Z"
          fill="url(#mark-fill)"
          stroke="url(#mark-stroke)"
          strokeWidth="2.4"
        />
        <path
          d="M31.6 10.5h8.1c1.8 0 3.2 1.6 2.9 3.4l-2.3 16.6c-0.2 1.2 0.8 2.3 2 2.3h17.3c1.6 0 2.9 1.3 2.9 2.9"
          fill="none"
          stroke="rgba(255,255,255,0.56)"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <circle cx="22.5" cy="35.8" r="2.4" fill="rgba(255,255,255,0.86)" />
        <circle cx="34.8" cy="24.2" r="1.3" fill="rgba(255,255,255,0.55)" />
      </g>
    </svg>
  );
}

export function Brand() {
  return (
    <div className="brand" aria-label="Atende+">
      <LogoMark />
      <strong>
        Atende<span>+</span>
      </strong>
    </div>
  );
}

export default function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="sidebar glass-panel">
      <Brand />

      <nav className="side-nav" aria-label="Menu principal">
        <NavLink to="/dashboard" className="side-link">
          <Home size={18} />
          <span>Atendimentos</span>
        </NavLink>
        <button className="side-link side-button" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </nav>

      <div className="user-card">
        <span className="avatar">DS</span>
        <span>
          <strong>{user?.nome || 'Dr. João Silva'}</strong>
          <small>Profissional</small>
        </span>
        <ChevronDown size={16} />
      </div>
    </aside>
  );
}
