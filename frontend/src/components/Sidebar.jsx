import { ChevronDown, LogOut, Home } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import atendeMark from '../assets/atende-mark.png';
import { useAuth } from '../contexts/AuthContext.jsx';

export function Brand() {
  return (
    <div className="brand" aria-label="Atende+">
      <img className="brand-mark" src={atendeMark} alt="" aria-hidden="true" />
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
