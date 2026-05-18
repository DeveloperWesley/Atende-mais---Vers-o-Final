import { CheckCircle, Eye, EyeOff, Lock, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogoMark } from '../components/Sidebar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

const REQS = [
  { key:'len',     label:'Mínimo 8 caracteres', test: v => v.length >= 8       },
  { key:'upper',   label:'Letra maiúscula',      test: v => /[A-Z]/.test(v)    },
  { key:'lower',   label:'Letra minúscula',      test: v => /[a-z]/.test(v)    },
  { key:'number',  label:'Número',               test: v => /\d/.test(v)       },
  { key:'special', label:'Caractere especial',   test: v => /[^A-Za-z0-9]/.test(v) },
];

export default function RedefinirSenha() {
  const { usuarios, setUsuarios } = useAuth();
  const { theme, toggleTheme }    = useTheme();
  const navigate                  = useNavigate();
  const [params]                  = useSearchParams();
  const token                     = params.get('token');

  const [status,   setStatus]   = useState('validating'); // validating | valid | invalid | success
  const [userId,   setUserId]   = useState(null);
  const [nova,     setNova]     = useState('');
  const [confirma, setConfirma] = useState('');
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [erro,     setErro]     = useState('');

  /* Valida o token ao carregar */
  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    try {
      const stored = localStorage.getItem('reset_token');
      if (!stored) { setStatus('invalid'); return; }
      const { token: t, userId: uid, expires } = JSON.parse(stored);
      if (t !== token || Date.now() > expires) { setStatus('invalid'); return; }
      setUserId(uid);
      setStatus('valid');
    } catch {
      setStatus('invalid');
    }
  }, [token]);

  const reqs = REQS.map(r => ({ ...r, met: r.test(nova) }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!REQS.every(r => r.test(nova)))  { setErro('A senha não atende todos os requisitos.'); return; }
    if (nova !== confirma)               { setErro('As senhas não coincidem.'); return; }
    setErro('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    /* Atualiza senha no contexto (mock — no backend seria PATCH /auth/reset-password) */
    if (setUsuarios) {
      setUsuarios(prev => prev.map(u =>
        u.id === userId ? { ...u, senha: nova } : u
      ));
    }
    localStorage.removeItem('reset_token');
    setStatus('success');
    setLoading(false);
  }

  /* ── Token inválido/expirado ── */
  if (status === 'invalid') {
    return (
      <div className="login-page">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:24 }}>
          <div className="login-form-card" style={{ maxWidth:420, width:'100%', textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--red-bg)', color:'var(--red)', display:'inline-grid', placeItems:'center', marginBottom:16 }}>
              <ShieldCheck size={24}/>
            </div>
            <h2 style={{ margin:'0 0 10px', fontWeight:800 }}>Link inválido ou expirado</h2>
            <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', marginBottom:24, lineHeight:1.6 }}>
              Este link de redefinição não é válido ou já expirou.<br/>Os links são válidos por 30 minutos.
            </p>
            <Link to="/esqueci-senha">
              <button className="btn btn-primary" style={{ width:'100%', marginBottom:10 }}>Solicitar novo link</button>
            </Link>
            <Link to="/login" style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>Voltar para o login</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Validando ── */
  if (status === 'validating') {
    return (
      <div className="login-page" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
        <p style={{ color:'var(--text-muted)' }}>Validando link…</p>
      </div>
    );
  }

  /* ── Sucesso ── */
  if (status === 'success') {
    return (
      <div className="login-page">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:24 }}>
          <div className="login-form-card" style={{ maxWidth:420, width:'100%', textAlign:'center' }}>
            <div style={{ width:60, height:60, borderRadius:'50%', background:'var(--green-bg)', color:'var(--green)', display:'inline-grid', placeItems:'center', marginBottom:20 }}>
              <CheckCircle size={28}/>
            </div>
            <h2 style={{ margin:'0 0 10px', fontWeight:800 }}>Senha redefinida!</h2>
            <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', marginBottom:24, lineHeight:1.6 }}>
              Sua senha foi alterada com sucesso.<br/>Agora você pode fazer login com a nova senha.
            </p>
            <button className="btn btn-primary" style={{ width:'100%' }}
              onClick={() => navigate('/login')}>
              Ir para o login →
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Formulário de nova senha ── */
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
          <div className="login-logo-mini"><LogoMark size={52}/></div>

          <div className="login-form-heading">
            <h1>Nova senha</h1>
            <p>Escolha uma senha segura para sua conta.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form-fields">
            {erro && <div className="form-error">{erro}</div>}

            <label className="field">
              <span className="field-label">Nova senha</span>
              <span className="input-shell">
                <Lock size={17} strokeWidth={1.9}/>
                <input
                  type={show ? 'text' : 'password'}
                  placeholder="Digite a nova senha"
                  value={nova}
                  onChange={e => { setNova(e.target.value); setErro(''); }}
                />
                <button type="button" className="input-suffix-btn"
                  onClick={() => setShow(v => !v)} tabIndex={-1}>
                  {show ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              </span>
            </label>

            <label className="field">
              <span className="field-label">Confirmar nova senha</span>
              <span className="input-shell">
                <Lock size={17} strokeWidth={1.9}/>
                <input
                  type={show ? 'text' : 'password'}
                  placeholder="Repita a nova senha"
                  value={confirma}
                  onChange={e => { setConfirma(e.target.value); setErro(''); }}
                />
              </span>
            </label>

            {/* Requisitos */}
            <div className="acfg-pwd-reqs">
              <div className="acfg-pwd-reqs-list">
                {reqs.map(r => (
                  <span key={r.key} className={`acfg-pwd-req${r.met ? ' met' : ''}`}>
                    <CheckCircle size={12}/> {r.label}
                  </span>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-login"
              disabled={loading || !REQS.every(r => r.test(nova)) || nova !== confirma}>
              {loading ? 'Salvando…' : 'Redefinir senha'}
            </button>

            <Link to="/login"
              style={{ textAlign:'center', display:'block', fontSize:'0.85rem', color:'var(--text-muted)' }}>
              Voltar para o login
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
