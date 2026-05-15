import { CheckCircle, Eye, EyeOff, Lock, Mail, Moon, ShieldCheck, Sun, User } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogoMark } from '../components/Sidebar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

export default function Cadastro() {
  const { registrar } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmarSenha: '', especialidade: '' });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function validar() {
    const erros = {};
    if (!form.nome.trim()) erros.nome = 'Nome é obrigatório.';
    if (!form.email.trim()) erros.email = 'E-mail é obrigatório.';
    if (form.senha.length < 6) erros.senha = 'Mínimo 6 caracteres.';
    if (form.senha !== form.confirmarSenha) erros.confirmarSenha = 'As senhas não conferem.';
    if (!form.especialidade.trim()) erros.especialidade = 'Especialidade é obrigatória.';
    return erros;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const erros = validar();
    if (Object.keys(erros).length > 0) { setErrors(erros); return; }
    setErrors({});
    setLoading(true);
    try {
      await registrar({ nome: form.nome, email: form.email, senha: form.senha, especialidade: form.especialidade });
      setSucesso(true);
    } catch (err) {
      setErrors({ geral: err.message || 'Erro ao criar conta.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-page-top">
        <button className="theme-toggle-text" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </button>
      </div>

      <div className="login-grid">
        {/* Left column (hidden on mobile) */}
        <section className="login-left">
          <div className="login-dots" />
          <div className="login-left-content">
            <div className="brand login-brand-large">
              <LogoMark size={64} />
              <strong>Atende<span>+</span></strong>
            </div>
            <h1 className="login-headline">
              Crie sua conta
              <span className="login-headline-gradient">e comece agora.</span>
            </h1>
            <p className="login-desc">
              Após o cadastro, o administrador irá revisar e liberar seu acesso
              para que você possa começar a registrar seus atendimentos.
            </p>
          </div>
          <svg className="login-wave" viewBox="0 0 1440 180" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,100 C240,160 480,40 720,100 C960,160 1200,40 1440,100 L1440,180 L0,180 Z" fill="rgba(124,58,237,0.05)" />
            <path d="M0,120 C360,60 720,160 1080,100 C1260,70 1380,130 1440,120 L1440,180 L0,180 Z" fill="rgba(168,85,247,0.04)" />
          </svg>
        </section>

        {/* Right column */}
        <section className="login-right">
          <div className="login-form-card">
            <div className="login-logo-mini">
              <LogoMark size={52} />
            </div>

            {sucesso ? (
              <div className="success-card" style={{ padding: '24px 0' }}>
                <div className="success-icon"><CheckCircle size={32} /></div>
                <h2>Cadastro enviado!</h2>
                <p>Sua solicitação foi recebida. Em breve o administrador irá revisar e liberar seu acesso.</p>
                <Link to="/login" style={{ marginTop: 12 }}>
                  <button className="btn btn-primary">Voltar para o login</button>
                </Link>
              </div>
            ) : (
              <>
                <div className="login-form-heading">
                  <h1>Criar conta</h1>
                  <p>Preencha os dados para solicitar acesso</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form-fields">
                  {errors.geral && <div className="form-error">{errors.geral}</div>}

                  <label className="field">
                    <span className="field-label">Nome completo</span>
                    <span className="input-shell">
                      <User size={17} strokeWidth={1.9} />
                      <input type="text" placeholder="Dr. João Silva" value={form.nome} onChange={set('nome')} required />
                    </span>
                    {errors.nome && <span className="field-error">{errors.nome}</span>}
                  </label>

                  <label className="field">
                    <span className="field-label">E-mail</span>
                    <span className="input-shell">
                      <Mail size={17} strokeWidth={1.9} />
                      <input type="email" placeholder="seu@email.com" value={form.email} onChange={set('email')} required />
                    </span>
                    {errors.email && <span className="field-error">{errors.email}</span>}
                  </label>

                  <label className="field">
                    <span className="field-label">Especialidade</span>
                    <span className="input-shell">
                      <input type="text" placeholder="Ex: Psicologia, Nutrição, Fisioterapia…" value={form.especialidade} onChange={set('especialidade')} />
                    </span>
                    {errors.especialidade && <span className="field-error">{errors.especialidade}</span>}
                  </label>

                  <label className="field">
                    <span className="field-label">Senha</span>
                    <span className="input-shell">
                      <Lock size={17} strokeWidth={1.9} />
                      <input type={showPass ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={form.senha} onChange={set('senha')} />
                      <button type="button" className="input-suffix-btn" onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
                        {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </span>
                    {errors.senha && <span className="field-error">{errors.senha}</span>}
                  </label>

                  <label className="field">
                    <span className="field-label">Confirmar senha</span>
                    <span className="input-shell">
                      <Lock size={17} strokeWidth={1.9} />
                      <input type={showPass ? 'text' : 'password'} placeholder="Repita a senha" value={form.confirmarSenha} onChange={set('confirmarSenha')} />
                    </span>
                    {errors.confirmarSenha && <span className="field-error">{errors.confirmarSenha}</span>}
                  </label>

                  <button type="submit" className="btn btn-primary btn-login" disabled={loading}>
                    {loading ? 'Enviando…' : 'Solicitar acesso'}
                    {!loading && <span style={{ fontSize: '1.1em' }}>→</span>}
                  </button>

                  <p className="auth-link-row">
                    Já tem uma conta? <Link to="/login">Entrar</Link>
                  </p>
                </form>
              </>
            )}
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
