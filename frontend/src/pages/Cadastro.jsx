import { ArrowLeft, CheckCircle, Eye, EyeOff, IdCard, Lock, Mail, Moon, ShieldCheck, Sun, User } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogoMark } from '../components/Sidebar.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { api } from '../services/api.js';

const ESPECIALIDADES = [
  'Psicologia','Nutrição','Medicina','Fonoaudiologia','Fisioterapia',
  'Odontologia','Terapia Ocupacional','Enfermagem','Biomedicina',
  'Farmácia','Personal trainer','Outro',
];

export default function Cadastro() {
  const { theme, toggleTheme } = useTheme();

  const [etapa,   setEtapa]   = useState(1); // 1=form | 2=código | 3=sucesso
  const [form,    setForm]    = useState({ nome:'', email:'', cpf:'', sexo:'Não informar', especialidade:'', senha:'', confirmarSenha:'' });
  const [codigo,  setCodigo]  = useState('');
  const [errors,  setErrors]  = useState({});
  const [codigoErro, setCodigoErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass,setShowPass]= useState(false);
  const [reenviando,setReenviando] = useState(false);

  function set(field) { return (e) => setForm(f => ({ ...f, [field]: e.target.value })); }

  function maskCpfCnpj(v) {
    const d = v.replace(/\D/g,'').slice(0,14);
    if (d.length <= 11)
      return d.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
    return d.replace(/(\d{2})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1/$2').replace(/(\d{4})(\d{1,2})$/,'$1-$2');
  }

  function validar() {
    const erros = {};
    if (!form.nome.trim())           erros.nome          = 'Nome é obrigatório.';
    if (!form.email.trim())          erros.email         = 'E-mail é obrigatório.';
    const cpfDigits = form.cpf.replace(/\D/g,'');
    if (!cpfDigits || (cpfDigits.length !== 11 && cpfDigits.length !== 14))
                                     erros.cpf           = 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.';
    if (!form.especialidade)         erros.especialidade = 'Especialidade é obrigatória.';
    if (form.senha.length < 6)       erros.senha         = 'Mínimo 6 caracteres.';
    if (form.senha !== form.confirmarSenha) erros.confirmarSenha = 'As senhas não conferem.';
    return erros;
  }

  /* Etapa 1 → envia código para o e-mail */
  async function handleSubmit(e) {
    e.preventDefault();
    const erros = validar();
    if (Object.keys(erros).length) { setErrors(erros); return; }
    setErrors({});
    setLoading(true);
    try {
      await api.enviarCodigo({ nome: form.nome, email: form.email, cpf: form.cpf, senha: form.senha, especialidade: form.especialidade, sexo: form.sexo });
      setEtapa(2);
    } catch (err) {
      setErrors({ geral: err.message || 'Erro ao enviar código.' });
    } finally {
      setLoading(false);
    }
  }

  /* Etapa 2 → verifica código */
  async function handleVerificar(e) {
    e.preventDefault();
    if (codigo.trim().length < 6) { setCodigoErro('Digite o código de 6 dígitos.'); return; }
    setLoading(true);
    setCodigoErro('');
    try {
      await api.verificarCodigo({ email: form.email, codigo: codigo.trim() });
      setEtapa(3);
    } catch (err) {
      setCodigoErro(err.message || 'Código incorreto.');
    } finally {
      setLoading(false);
    }
  }

  /* Reenviar código */
  async function handleReenviar() {
    setReenviando(true);
    setCodigoErro('');
    setCodigo('');
    try {
      await api.reenviarCodigo(form.email);
    } catch (err) {
      setCodigoErro('Erro ao reenviar. Tente novamente.');
    } finally {
      setReenviando(false);
    }
  }

  const leftCol = (
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
  );

  return (
    <div className="login-page">
      <div className="login-page-top">
        <button className="theme-toggle-text" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </button>
      </div>

      <div className="login-grid">
        {leftCol}

        <section className="login-right">
          <div className="login-form-card">
            <div className="login-logo-mini"><LogoMark size={52} /></div>

            {/* ── Etapa 3: Sucesso ── */}
            {etapa === 3 && (
              <div style={{ textAlign:'center', padding:'16px 0' }}>
                <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--green-bg)', color:'var(--green)', display:'inline-grid', placeItems:'center', marginBottom:16 }}>
                  <CheckCircle size={28} />
                </div>
                <h2 style={{ margin:'0 0 10px', fontWeight:800 }}>Cadastro enviado!</h2>
                <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', marginBottom:24, lineHeight:1.6 }}>
                  E-mail verificado com sucesso!<br />
                  O administrador irá revisar e liberar seu acesso em breve.
                </p>
                <Link to="/login">
                  <button className="btn btn-primary" style={{ width:'100%' }}>Ir para o login</button>
                </Link>
              </div>
            )}

            {/* ── Etapa 2: Verificação de código ── */}
            {etapa === 2 && (
              <>
                <div className="login-form-heading">
                  <h1>Verifique seu e-mail</h1>
                  <p>
                    Enviamos um código de 6 dígitos para<br />
                    <strong style={{ color:'var(--primary)' }}>{form.email}</strong>
                  </p>
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
                        value={codigo}
                        onChange={e => { setCodigo(e.target.value.replace(/\D/g,'')); setCodigoErro(''); }}
                        style={{ letterSpacing:'0.3em', fontSize:'1.4rem', fontWeight:800, textAlign:'center' }}
                        autoFocus
                      />
                    </span>
                  </label>

                  <button type="submit" className="btn btn-primary btn-login"
                    disabled={loading || codigo.length < 6}>
                    {loading ? 'Verificando…' : 'Confirmar e criar conta'}
                  </button>

                  <div style={{ textAlign:'center' }}>
                    <span style={{ fontSize:'0.83rem', color:'var(--text-muted)' }}>
                      Não recebeu?{' '}
                      <button type="button" className="soft-link"
                        style={{ background:'none', border:'none', cursor:'pointer', fontWeight:600 }}
                        onClick={handleReenviar} disabled={reenviando}>
                        {reenviando ? 'Reenviando…' : 'Reenviar código'}
                      </button>
                    </span>
                  </div>

                  <button type="button" className="auth-link-row"
                    style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
                    onClick={() => { setEtapa(1); setCodigo(''); setCodigoErro(''); }}>
                    <ArrowLeft size={14} /> Voltar e corrigir dados
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

                  <label className="field">
                    <span className="field-label">Nome completo</span>
                    <span className="input-shell">
                      <User size={17} strokeWidth={1.9} />
                      <input type="text" placeholder="Seu nome completo" value={form.nome} onChange={set('nome')} required />
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
                    <span className="field-label">CPF ou CNPJ *</span>
                    <span className="input-shell">
                      <IdCard size={17} strokeWidth={1.9} />
                      <input
                        type="text"
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        value={form.cpf}
                        onChange={e => setForm(f => ({ ...f, cpf: maskCpfCnpj(e.target.value) }))}
                        inputMode="numeric"
                      />
                    </span>
                    {errors.cpf && <span className="field-error">{errors.cpf}</span>}
                  </label>

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

                  <label className="field">
                    <span className="field-label">Senha</span>
                    <span className="input-shell">
                      <Lock size={17} strokeWidth={1.9} />
                      <input type={showPass ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={form.senha} onChange={set('senha')} />
                      <button type="button" className="input-suffix-btn" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
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
                    {loading ? 'Enviando código…' : 'Solicitar acesso →'}
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
