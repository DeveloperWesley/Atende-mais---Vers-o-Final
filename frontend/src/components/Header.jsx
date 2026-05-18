import { Bell, ChevronDown, Menu, Moon, Plus, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSidebar } from '../contexts/SidebarContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

export default function Header({ onNovoAtendimento, notificacoes = 3, title, subtitle, actions }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggle } = useSidebar();

  const primeiroNome = user?.nome?.split(' ')[0] || 'Doutor(a)';
  const displayTitle    = title    ?? `Olá, ${primeiroNome}!`;
  const displaySubtitle = subtitle ?? 'Aqui está o resumo financeiro do seu consultório.';

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        {/* Hamburger — visível só no mobile via CSS */}
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

        <button className="notif-btn" aria-label="Notificações">
          <Bell size={18} />
          {notificacoes > 0 && <span className="notif-badge">{notificacoes}</span>}
        </button>

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
