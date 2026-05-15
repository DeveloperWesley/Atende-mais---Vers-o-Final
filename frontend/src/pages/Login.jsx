import { Clock, Eye, EyeOff, FileText, Lock, Mail, Moon, Shield, ShieldCheck, Sun } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brand, LogoMark } from '../components/Sidebar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

const FEATURES = [
  {
    icon: Shield,
    title: 'Seus dados protegidos',
    desc: 'Segurança e privacidade em primeiro lugar.'
  },
  {
    icon: FileText,
    title: 'Gestão financeira simplificada',
    desc: 'Organize atendimentos e acompanhe seus recebimentos facilmente.'
  },
  {
    icon: Clock,
    title: 'Mais tempo para o que importa',
    desc: 'Menos burocracia, mais cuidado com seus pacientes.'
  }
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [credentials, setCredentials] = useState({ email: '', senha: '' });
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field) {
    return (e) => setCredentials((c) => ({ ...c, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(credentials);
      navigate(user.perfil === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Theme toggle */}
      <div className="login-page-top">
        <button className="theme-toggle-text" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </button>
      </div>

      <div className="login-grid">
        {/* ── LEFT COLUMN ── */}
        <section className="login-left">
          <div className="login-dots" />

          <div className="login-left-content">
            {/* Brand */}
            <Brand size={68} glow />

            {/* Headline */}
            <h1 className="login-headline">
              Simples para você.
              <span className="login-headline-gradient">
                Completo para<br />seu negócio.
              </span>
            </h1>

            <p className="login-desc">
              O Atende+ ajuda profissionais da saúde a organizarem atendimentos,
              finanças e <strong>documentação fiscal</strong> de forma simples e segura.
            </p>

            {/* Features */}
            <ul className="login-features">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="login-feature-item">
                  <div className="login-feature-icon">
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <div className="login-feature-text">
                    <strong>{title}</strong>
                    <p>{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Wave */}
          <svg className="login-wave" viewBox="0 0 1440 180" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,100 C240,160 480,40 720,100 C960,160 1200,40 1440,100 L1440,180 L0,180 Z" fill="rgba(124,58,237,0.05)" />
            <path d="M0,120 C360,60 720,160 1080,100 C1260,70 1380,130 1440,120 L1440,180 L0,180 Z" fill="rgba(168,85,247,0.04)" />
          </svg>
        </section>

        {/* ── RIGHT COLUMN ── */}
        <section className="login-right">
          <div className="login-form-card">
            {/* Logo */}
            <div className="login-logo-mini">
              <LogoMark size={80} />
            </div>

            <div className="login-form-heading">
              <h1>Acesse sua conta</h1>
              <p>Entre com seu e-mail e senha para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form-fields">
              {error && <div className="form-error">{error}</div>}

              <label className="field">
                <span className="field-label">E-mail</span>
                <span className="input-shell">
                  <Mail size={17} strokeWidth={1.9} />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={credentials.email}
                    onChange={set('email')}
                    autoComplete="email"
                    required
                  />
                </span>
              </label>

              <label className="field">
                <span className="field-label">Senha</span>
                <span className="input-shell">
                  <Lock size={17} strokeWidth={1.9} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={credentials.senha}
                    onChange={set('senha')}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="input-suffix-btn"
                    onClick={() => setShowPass((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>

              <div className="login-form-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Lembrar de mim
                </label>
                <a href="#recuperar" className="soft-link">Esqueci minha senha</a>
              </div>

              <button type="submit" className="btn btn-primary btn-login" disabled={loading}>
                {loading ? 'Entrando…' : 'Entrar'}
                {!loading && <span style={{ fontSize: '1.1em' }}>→</span>}
              </button>

              <p className="auth-link-row">
                Ainda não tem uma conta?{' '}
                <Link to="/cadastro">Criar conta →</Link>
              </p>
            </form>
          </div>

          <footer className="login-footer">
            <p><ShieldCheck size={15} /> Seus dados protegidos com segurança</p>
            <small>© {new Date().getFullYear()} Atende+ • Todos os direitos reservados.</small>
          </footer>
        </section>
      </div>
    </div>
  );
}
