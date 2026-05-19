import { LogOut, Settings, Shield } from 'lucide-react';
import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { useSidebar } from '../contexts/SidebarContext.jsx';
import { Brand, LogoMark } from './Sidebar.jsx';

function getInitials(nome = '') {
  const parts = nome.trim().split(' ').filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminSidebar() {
  const { logout, user } = useAuth();
  const { settings, avatar } = useSettings();
  const navigate         = useNavigate();
  const { open, close }  = useSidebar();

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <>
      <div className={`sidebar-overlay${open ? ' active' : ''}`} onClick={close} aria-hidden="true" />
      <aside className={`sidebar${open ? ' sidebar-open' : ''}`}>

        <div className="sidebar-header">
          <Brand />
        </div>

        <nav className="side-nav" aria-label="Menu administração">
          <NavLink to="/admin" end onClick={close}
            className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
            <Shield size={18} />
            <span>Administração</span>
          </NavLink>

          <NavLink to="/admin/configuracoes" onClick={close}
            className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
            <Settings size={18} />
            <span>Configurações</span>
          </NavLink>

          <div className="side-divider" />

          <button className="side-link" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </nav>

        <div className="user-card user-card-static">
          {avatar
            ? <img src={avatar} alt="Avatar" style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
            : <div className="avatar">{getInitials(user?.nome)}</div>
          }
          <div className="user-card-info">
            <strong>{user?.nome || 'Administrador'}</strong>
            <small>Administrador</small>
          </div>
        </div>
      </aside>
    </>
  );
}
