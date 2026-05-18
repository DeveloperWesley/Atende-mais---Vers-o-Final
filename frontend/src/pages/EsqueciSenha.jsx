import { ArrowLeft, IdCard, Mail, Moon, Send, ShieldCheck, Sun } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogoMark } from '../components/Sidebar.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { api } from '../services/api.js';

function maskCpf(v) {
  const d = v.replace(/\D/g,'').slice(0,11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
function isCpf(v)   { return onlyDigits(v).length === 11; }
function onlyDigits(v) { return v.replace(/\D/g,''); }

export default function EsqueciSenha() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [input,     setInput]     = useState('');
  const [isCpfMode, setIsCpfMode] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [enviado,   setEnviado]   = useState(null); // { email, token }
  const [erro,      setErro]      = useState('');

  function handleChange(e) {
    const raw = e.target.value;
    /* Detecta automaticamente se é CPF (apenas dígitos/pontos/traço) */
    const looksLikeCpf = /^[\d.\-\s]+$/.test(raw) && !raw.includes('@');
    setIsCpfMode(looksLikeCpf && raw.length > 0);
    setInput(looksLikeCpf ? maskCpf(raw) : raw);
    setErro('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) { setErro('Informe seu e-mail.'); return; }

    // Só aceita e-mail (CPF não é suportado no backend)
    const valor = input.trim();
    if (!isEmail(valor)) { setErro('Informe um e-mail válido.'); return; }

    setLoading(true);
    try {
      const res = await api.esqueciSenha(valor);
      // Em dev, o backend retorna o token diretamente
      const token = res?.token || '__enviado__';
      setEnviado({ email: valor, token });
    } catch (err) {
      setErro(err.message || 'Erro ao processar solicitação.');
    } finally {
      setLoading(false);
    }
  }

  /* ── Tela de confirmação ── */
  if (enviado) {
    return (
      <div className="login-page">
        <div className="login-page-top">
          <button className="theme-toggle-text" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>}
            {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          </button>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:24 }}>
          <div className="login-form-card" style={{ maxWidth:440, width:'100%', textAlign:'center' }}>
            <div style={{ width:60, height:60, borderRadius:'50%', background:'var(--primary-light)', color:'var(--primary)', display:'inline-grid', placeItems:'center', marginBottom:20 }}>
              <Mail size={26} />
            </div>
            <h2 style={{ margin:'0 0 10px', fontWeight:800, fontSize:'1.3rem' }}>Link enviado!</h2>
            <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', lineHeight:1.6, marginBottom:24 }}>
              Enviamos um link de redefinição para<br/>
              <strong style={{ color:'var(--primary)' }}>{enviado.email}</strong><br/>
              O link expira em <strong>30 minutos</strong>.
            </p>

            {/* Aviso dev — remover quando tiver backend */}
            <div className="cadastro-dev-notice" style={{ marginBottom:20 }}>
              Modo demonstração — use o botão abaixo para acessar o link
            </div>

            <button className="btn btn-primary" style={{ width:'100%', marginBottom:12 }}
              onClick={() => navigate(`/redefinir-senha?token=${enviado.token}`)}>
              Acessar link de redefinição →
            </button>

            <Link to="/login" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:'0.85rem', color:'var(--text-muted)', textDecoration:'none' }}>
              <ArrowLeft size={14}/> Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Formulário principal ── */
  return (
    <div className="login-page">
      <div className="login-page-top">
        <button className="theme-toggle-text" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>}
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </button>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:24 }}>
        <div className="login-form-card" style={{ maxWidth:440, width:'100%' }}>
          <div className="login-logo-mini"><LogoMark size={52} /></div>

          <div className="login-form-heading">
            <h1>Esqueci minha senha</h1>
            <p>Informe seu e-mail ou CPF cadastrado e enviaremos um link para redefinir sua senha.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form-fields">
            {erro && <div className="form-error">{erro}</div>}

            <label className="field">
              <span className="field-label">E-mail ou CPF</span>
              <span className="input-shell">
                {isCpfMode
                  ? <IdCard size={17} strokeWidth={1.9} />
                  : <Mail   size={17} strokeWidth={1.9} />
                }
                <input
                  type="text"
                  placeholder="seu@email.com ou 000.000.000-00"
                  value={input}
                  onChange={handleChange}
                  autoFocus
                />
              </span>
              <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>
                O ícone muda conforme você digita e-mail ou CPF.
              </span>
            </label>

            <button type="submit" className="btn btn-primary btn-login" disabled={loading}>
              {loading
                ? 'Verificando…'
                : <><Send size={15}/> Enviar link de redefinição</>
              }
            </button>

            <Link to="/login"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:'0.85rem', color:'var(--text-muted)', textDecoration:'none' }}>
              <ArrowLeft size={14}/> Voltar para o login
            </Link>
          </form>
        </div>
      </div>

      <footer className="login-footer" style={{ position:'fixed', bottom:0, width:'100%' }}>
        <p><ShieldCheck size={15}/> Seus dados protegidos com segurança</p>
        <small>© {new Date().getFullYear()} Atende+ • Todos os direitos reservados.</small>
      </footer>
    </div>
  );
}
