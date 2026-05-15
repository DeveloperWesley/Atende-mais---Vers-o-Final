import { Bell, ChevronDown, Moon, Plus, Search, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

export default function Header({ onNovoAtendimento, notificacoes = 3, title, subtitle, actions }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const primeiroNome = user?.nome?.split(' ')[0] || 'Doutor(a)';

  // Título e subtítulo: usa props customizadas ou fallback do dashboard
  const displayTitle    = title    ?? `Olá, ${primeiroNome}! 👋`;
  const displaySubtitle = subtitle ?? 'Aqui está o resumo financeiro do seu consultório.';

  return (
    <header className="top-bar">
      <div className="top-bar-greeting">
        <h1>{displayTitle}</h1>
        <p>{displaySubtitle}</p>
      </div>

      <div className="top-bar-actions">
        {/* Search */}
        <div className="search-bar">
          <Search size={16} strokeWidth={2} color="var(--text-light)" />
          <input type="search" placeholder="Buscar paciente, CPF ou pagador..." readOnly />
          <span className="search-kbd">⌘K</span>
        </div>

        {/* Theme control */}
        <button className="theme-control" onClick={toggleTheme}>
          {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
          {theme === 'dark' ? 'Escuro' : 'Claro'}
          <ChevronDown size={13} />
          <div className="toggle-switch" />
        </button>

        {/* Notifications */}
        <button className="notif-btn" aria-label="Notificações">
          <Bell size={18} />
          {notificacoes > 0 && <span className="notif-badge">{notificacoes}</span>}
        </button>

        {/* Ação customizada (ex: Nova despesa) ou botão padrão */}
        {actions ?? (
          onNovoAtendimento && (
            <button className="btn btn-primary btn-md" onClick={onNovoAtendimento}>
              <Plus size={17} strokeWidth={2.5} />
              Novo atendimento
            </button>
          )
        )}
      </div>
    </header>
  );
}
