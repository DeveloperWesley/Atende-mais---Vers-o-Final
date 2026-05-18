import { CheckCircle, Eye, EyeOff, Lock, Mail, Moon, ShieldCheck, Sun, User } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogoMark } from '../components/Sidebar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

/* Gera código de 6 dígitos e simula envio (frontend-only) */
function gerarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const ESPECIALIDADES = [
  'Psicologia','Nutrição','Medicina','Fonoaudiologia','Fisioterapia',
  'Odontologia','Terapia Ocupacional','Enfermagem','Biomedicina',
  'Farmácia','Personal trainer','Outro',
];

export default function Cadastro() {
  const { registrar } = useAuth();
  const { theme, toggleTheme } = useTheme();

  /* Etapa 1 — formulário */
  const [form, setForm] = useState({
    nome: '', email: '', sexo: 'Não informar',
    especialidade: '', senha: '', confirmarSenha: '',
  });
  const [showPass,   setShowPass]   = useState(false);
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);

  /* Etapa 2 — verificação de e-mail */
  const [etapa,      setEtapa]      = useState(1); // 1 = form | 2 = código | 3 = sucesso
  const [codigoReal, setCodigoReal] = useState('');
  const [codigoInput,setCodigoInput]= useState('');
  const [codigoErro, setCodigoErro] = useState('');
  const [reenvios,   setReenvios]   = useState(0);
  const [reenviando, setReenviando] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function validar() {
    const erros = {};
    if (!form.nome.trim())              erros.nome          = 'Nome é obrigatório.';
    if (!form.email.trim())             erros.email         = 'E-mail é obrigatório.';
    if (!form.especialidade)            erros.especialidade = 'Especialidade é obrigatória.';
    if (form.senha.length < 6)          erros.senha         = 'Mínimo 6 caracteres.';
    if (form.senha !== form.confirmarSenha) erros.confirmarSenha = 'As senhas não conferem.';
    return erros;
  }

  /* Etapa 1 → envia "e-mail" com código */
  async function handleSubmit(e) {
    e.preventDefault();
    const erros = validar();
    if (Object.keys(erros).length) { setErrors(erros); return; }
    setErrors({});
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); /* simula latência */
    const codigo = gerarCodigo();
    setCodigoReal(codigo);
    console.info(`[DEV] Código de verificação para ${form.email}: ${codigo}`);
    setLoading(false);
    setEtapa(2);
  }

  /* Etapa 2 → valida código e finaliza cadastro */
  async function handleVerificar(e) {
    e.preventDefault();
    if (codigoInput.trim() !== codigoReal) {
      setCodigoErro('Código incorreto. Verifique seu e-mail e tente novamente.');
      return;
    }
    setLoading(true);
    try {
      await registrar({
        nome: form.nome, email: form.email, senha: form.senha,
        especialidade: form.especialidade, sexo: form.sexo,
      });
      setEtapa(3);
    } catch (err) {
      setCodigoErro(err.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  }

  /* Reenviar código */
  async function handleReenviar() {
    setReenviando(true);
    await new Promise(r => setTimeout(r, 1000));
    const novo = gerarCodigo();
    setCodigoReal(novo);
    setCodigoInput('');
    setCodigoErro('');
    setReenvios(n => n + 1);
    console.info(`[DEV] Novo código para ${form.email}: ${novo}`);
    setReenviando(false);
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
        {/* Coluna esquerda */}
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

        {/* Coluna direita */}
        <section className="login-right">
          <div className="login-form-card">
            <div className="login-logo-mini">
              <LogoMark size={52} />
            </div>

            {/* ── Etapa 3: Sucesso ── */}
            {etapa === 3 && (
              <div style={{ textAlign:'center', padding:'16px 0' }}>
                <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--green-bg)', color:'var(--green)', display:'inline-grid', placeItems:'center', marginBottom:16 }}>
                  <CheckCircle size={28} />
                </div>
                <h2 style={{ margin:'0 0 10px', fontWeight:800 }}>Cadastro enviado!</h2>
                <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', marginBottom:24, lineHeight:1.6 }}>
                  Sua solicitação foi recebida com sucesso.<br />
                  O administrador irá revisar e liberar seu acesso em breve.
                </p>
                <Link to="/login">
                  <button className="btn btn-primary" style={{ width:'100%' }}>Ir para o login</button>
                </Link>
              </div>
            )}

            {/* ── Etapa 2: Verificação de e-mail ── */}
            {etapa === 2 && (
              <>
                <div className="login-form-heading">
                  <h1>Verificar e-mail</h1>
                  <p>
                    Enviamos um código de 6 dígitos para<br />
                    <strong style={{ color:'var(--primary)' }}>{form.email}</strong>
                  </p>
                </div>

                {/* Badge de modo dev */}
                <div className="cadastro-dev-notice">
                  <span>Modo demonstração — veja o código no console do navegador (F12)</span>
                </div>

                <form onSubmit={handleVerificar} className="login-form-fields">
                  {codigoErro && <div className="form-error">{codigoErro}</div>}

                  <label className="field">
                    <span className="field-label">Código de verificação</span>
                    <span className="input-shell">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        value={codigoInput}
                        onChange={e => { setCodigoInput(e.target.value.replace(/\D/g,'')); setCodigoErro(''); }}
                        style={{ letterSpacing:'0.25em', fontSize:'1.3rem', textAlign:'center', fontWeight:700 }}
                        autoFocus
                      />
                    </span>
                  </label>

                  <button type="submit" className="btn btn-primary btn-login" disabled={loading || codigoInput.length < 6}>
                    {loading ? 'Verificando…' : 'Confirmar e criar conta'}
                  </button>

                  <div style={{ textAlign:'center', marginTop:4 }}>
                    <span style={{ fontSize:'0.83rem', color:'var(--text-muted)' }}>
                      Não recebeu?{' '}
                      <button
                        type="button"
                        className="soft-link"
                        style={{ background:'none', border:'none', cursor:'pointer', fontWeight:600 }}
                        onClick={handleReenviar}
                        disabled={reenviando}
                      >
                        {reenviando ? 'Reenviando…' : 'Reenviar código'}
                      </button>
                    </span>
                  </div>

                  <button type="button" className="auth-link-row"
                    style={{ background:'none', border:'none', cursor:'pointer', marginTop:4 }}
                    onClick={() => { setEtapa(1); setCodigoInput(''); setCodigoErro(''); }}>
                    ← Voltar e corrigir dados
                  </button>
                </form>
              </>
            )}

            {/* ── Etapa 1: Formulário ── */}
            {etapa === 1 && (
              <>
                <div className="login-form-heading">
                  <h1>Criar conta</h1>
                  <p>Preencha os dados para solicitar acesso</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form-fields">
                  {errors.geral && <div className="form-error">{errors.geral}</div>}

                  {/* Nome */}
                  <label className="field">
                    <span className="field-label">Nome completo</span>
                    <span className="input-shell">
                      <User size={17} strokeWidth={1.9} />
                      <input type="text" placeholder="Seu nome completo"
                        value={form.nome} onChange={set('nome')} required />
                    </span>
                    {errors.nome && <span className="field-error">{errors.nome}</span>}
                  </label>

                  {/* E-mail */}
                  <label className="field">
                    <span className="field-label">E-mail</span>
                    <span className="input-shell">
                      <Mail size={17} strokeWidth={1.9} />
                      <input type="email" placeholder="seu@email.com"
                        value={form.email} onChange={set('email')} required />
                    </span>
                    {errors.email && <span className="field-error">{errors.email}</span>}
                  </label>

                  {/* Sexo + Especialidade lado a lado */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <label className="field">
                      <span className="field-label">Sexo</span>
                      <span className="input-shell">
                        <select value={form.sexo} onChange={set('sexo')}>
                          <option>Masculino</option>
                          <option>Feminino</option>
                          <option>Não informar</option>
                        </select>
                      </span>
                    </label>

                    <label className="field">
                      <span className="field-label">Especialidade</span>
                      <span className="input-shell">
                        <select value={form.especialidade} onChange={set('especialidade')}>
                          <option value="">Selecione…</option>
                          {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </span>
                      {errors.especialidade && <span className="field-error">{errors.especialidade}</span>}
                    </label>
                  </div>

                  {/* Senha */}
                  <label className="field">
                    <span className="field-label">Senha</span>
                    <span className="input-shell">
                      <Lock size={17} strokeWidth={1.9} />
                      <input type={showPass ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        value={form.senha} onChange={set('senha')} />
                      <button type="button" className="input-suffix-btn"
                        onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                        {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </span>
                    {errors.senha && <span className="field-error">{errors.senha}</span>}
                  </label>

                  {/* Confirmar senha */}
                  <label className="field">
                    <span className="field-label">Confirmar senha</span>
                    <span className="input-shell">
                      <Lock size={17} strokeWidth={1.9} />
                      <input type={showPass ? 'text' : 'password'}
                        placeholder="Repita a senha"
                        value={form.confirmarSenha} onChange={set('confirmarSenha')} />
                    </span>
                    {errors.confirmarSenha && <span className="field-error">{errors.confirmarSenha}</span>}
                  </label>

                  <button type="submit" className="btn btn-primary btn-login" disabled={loading}>
                    {loading ? 'Enviando código…' : 'Solicitar acesso'}
                    {!loading && <span style={{ fontSize:'1.1em' }}>→</span>}
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
