import { Camera, Check, Eye, EyeOff, Lock, Settings, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar.jsx';
import Header from '../components/Header.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../services/api.js';

const AVATAR_KEY = 'atende_admin_avatar';

const sysDefaults = {
  notifEmail:    true,
  aprovacaoAuto: false,
  sessaoTimeout: '30',
  registroAcoes: true,
  fusoHorario:   'America/Sao_Paulo',
  idioma:        'pt-BR',
};

function SectionHeader({ icon: Icon, color, title, subtitle }) {
  return (
    <div className="cfg-section-header">
      <div className="cfg-section-icon" style={{ background: color }}>
        <Icon size={22} color="#fff" />
      </div>
      <div>
        <h2 className="cfg-section-title">{title}</h2>
        <p className="cfg-section-sub">{subtitle}</p>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="cfg-toggle-row">
      <div>
        <span className="field-label">{label}</span>
        {desc && <p className="cfg-toggle-desc">{desc}</p>}
      </div>
      <label className="cfg-toggle-switch">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="cfg-toggle-track" />
      </label>
    </div>
  );
}

function getInitials(nome = '') {
  const p = nome.trim().split(' ').filter(Boolean);
  if (!p.length) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

/* Requisitos de senha */
const REQS = [
  { key: 'len',     label: 'Mínimo 8 caracteres', test: v => v.length >= 8 },
  { key: 'upper',   label: 'Letra maiúscula',      test: v => /[A-Z]/.test(v) },
  { key: 'lower',   label: 'Letra minúscula',      test: v => /[a-z]/.test(v) },
  { key: 'number',  label: 'Número',               test: v => /\d/.test(v) },
  { key: 'special', label: 'Caractere especial',   test: v => /[^A-Za-z0-9]/.test(v) },
];

export default function AdminConfiguracoes() {
  const { user } = useAuth();
  const avatarRef = useRef(null);

  /* Perfil */
  const [profile, setProfile] = useState({
    nome:     '',
    telefone: '',
    email:    '',
    avatar:   localStorage.getItem(AVATAR_KEY) || null,
  });
  const [saved,    setSaved]    = useState(false);
  const [savingP,  setSavingP]  = useState(false);

  /* Config do sistema */
  const [sysConfig, setSysConfig] = useState(sysDefaults);

  /* Senha */
  const [senha,   setSenha]   = useState({ atual: '', nova: '', confirma: '' });
  const [showPwd, setShowPwd] = useState({ atual: false, nova: false, confirma: false });
  const [pwdMsg,  setPwdMsg]  = useState({ text: '', ok: false });
  const [savingS, setSavingS] = useState(false);

  /* Carrega dados do backend ao montar */
  useEffect(() => {
    api.meuPerfil()
      .then(d => setProfile(p => ({ ...p, nome: d.nome || '', telefone: d.telefone || '', email: d.email || '' })))
      .catch(console.error);
    api.listarAdminConfig()
      .then(d => setSysConfig(prev => ({
        ...prev,
        notifEmail:    d.notificacoesEmail   ?? prev.notifEmail,
        aprovacaoAuto: d.aprovacaoAutomatica ?? prev.aprovacaoAuto,
        sessaoTimeout: String(d.sessaoTimeout ?? prev.sessaoTimeout),
        registroAcoes: d.registroAcoes       ?? prev.registroAcoes,
        fusoHorario:   d.fusoHorario         ?? prev.fusoHorario,
        idioma:        d.idioma              ?? prev.idioma,
      })))
      .catch(console.error);
  }, []);

  /* Preenche nome/email do token enquanto a API carrega */
  useEffect(() => {
    if (user) setProfile(p => ({ ...p, nome: p.nome || user.nome || '', email: p.email || user.email || '' }));
  }, [user?.id]);

  function setP(f) { return e => setProfile(p => ({ ...p, [f]: e.target.value })); }
  function toggleShow(f) { setShowPwd(p => ({ ...p, [f]: !p[f] })); }

  function handleAvatar(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const b64 = ev.target.result;
      setProfile(p => ({ ...p, avatar: b64 }));
      localStorage.setItem(AVATAR_KEY, b64);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSavingP(true);
    try {
      await Promise.all([
        api.atualizarPerfil({ nome: profile.nome, telefone: profile.telefone }),
        api.salvarAdminConfig({
          notificacoesEmail:    sysConfig.notifEmail,
          aprovacaoAutomatica:  sysConfig.aprovacaoAuto,
          sessaoTimeout:        Number(sysConfig.sessaoTimeout),
          registroAcoes:        sysConfig.registroAcoes,
          fusoHorario:          sysConfig.fusoHorario,
          idioma:               sysConfig.idioma,
        }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err.message || 'Erro ao salvar.');
    } finally {
      setSavingP(false);
    }
  }

  async function handleChangePwd(e) {
    e.preventDefault();
    if (!senha.atual)             { setPwdMsg({ text: 'Informe a senha atual.', ok: false }); return; }
    const allOk = REQS.every(r => r.test(senha.nova));
    if (!allOk)                   { setPwdMsg({ text: 'A nova senha não atende todos os requisitos.', ok: false }); return; }
    if (senha.nova !== senha.confirma) { setPwdMsg({ text: 'As senhas não coincidem.', ok: false }); return; }

    setSavingS(true);
    try {
      await api.alterarSenha({ senhaAtual: senha.atual, novaSenha: senha.nova });
      setPwdMsg({ text: 'Senha alterada com sucesso!', ok: true });
      setSenha({ atual: '', nova: '', confirma: '' });
      setTimeout(() => setPwdMsg({ text: '', ok: false }), 3000);
    } catch (err) {
      setPwdMsg({ text: err.message || 'Erro ao alterar senha.', ok: false });
    } finally {
      setSavingS(false);
    }
  }

  const pwdReqs = REQS.map(r => ({ ...r, met: r.test(senha.nova) }));

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="content-area">
        <Header
          title="Configurações"
          subtitle="Gerencie as configurações da área administrativa do sistema."
          actions={
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={savingP}>
              <Check size={15} /> {saved ? 'Salvo!' : savingP ? 'Salvando…' : 'Salvar alterações'}
            </button>
          }
        />

        <div className="main-content">
          <div className="cfg-page">

            {/* ── 1. Dados do administrador ── */}
            <section className="surface-card cfg-card">
              <SectionHeader
                icon={User}
                color="linear-gradient(135deg,#6c5ce7,#a855f7)"
                title="Dados do administrador"
                subtitle="Atualize suas informações pessoais."
              />

              <div className="acfg-profile-row">
                <div className="acfg-fields">
                  <div className="cfg-fields-grid" style={{ gridTemplateColumns:'1fr 1fr' }}>
                    <div className="field">
                      <label className="field-label">Nome completo</label>
                      <div className="input-shell">
                        <input value={profile.nome} onChange={setP('nome')} placeholder="Nome completo" />
                      </div>
                    </div>
                    <div className="field">
                      <label className="field-label">Telefone</label>
                      <div className="input-shell">
                        <input value={profile.telefone} onChange={setP('telefone')} placeholder="(00) 00000-0000" inputMode="tel" />
                      </div>
                    </div>
                    <div className="field">
                      <label className="field-label">E-mail</label>
                      <div className="input-shell">
                        <input type="email" value={profile.email} onChange={setP('email')} placeholder="admin@email.com" />
                      </div>
                    </div>
                    <div className="field">
                      <label className="field-label">Cargo</label>
                      <div className="input-shell input-readonly">
                        <input value="Administrador" readOnly />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Avatar */}
                <div className="acfg-avatar-col">
                  <span className="field-label" style={{ marginBottom: 10, display:'block' }}>Foto do perfil</span>
                  <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                    <div className="cfg-avatar-wrap" onClick={() => avatarRef.current?.click()}>
                      {profile.avatar
                        ? <img src={profile.avatar} alt="Avatar" className="cfg-avatar-img" />
                        : <div className="cfg-avatar-placeholder">{getInitials(profile.nome)}</div>
                      }
                      <div className="cfg-avatar-overlay"><Camera size={18} /></div>
                    </div>
                    <div>
                      <button type="button" className="btn btn-ghost btn-sm"
                        onClick={() => avatarRef.current?.click()}>
                        <Camera size={14} /> Alterar foto
                      </button>
                      <p className="cfg-avatar-hint" style={{ marginTop: 6 }}>Formatos: JPG, PNG. Tamanho máximo: 2MB</p>
                    </div>
                  </div>
                  <input ref={avatarRef} type="file" accept="image/jpeg,image/png"
                    style={{ display:'none' }} onChange={handleAvatar} />
                </div>
              </div>
            </section>

            {/* ── 2. Segurança da conta ── */}
            <section className="surface-card cfg-card">
              <SectionHeader
                icon={Lock}
                color="linear-gradient(135deg,#2563eb,#6366f1)"
                title="Segurança da conta"
                subtitle="Gerencie a segurança da sua conta administrativa."
              />

              <form onSubmit={handleChangePwd}>
                <div className="cfg-fields-grid">
                  {[
                    { key: 'atual',    label: 'Senha atual',           ph: 'Digite sua senha atual'   },
                    { key: 'nova',     label: 'Nova senha',            ph: 'Digite uma nova senha'    },
                    { key: 'confirma', label: 'Confirmar nova senha',  ph: 'Confirme a nova senha'    },
                  ].map(({ key, label, ph }) => (
                    <div className="field" key={key}>
                      <label className="field-label">{label}</label>
                      <div className="input-shell">
                        <input
                          type={showPwd[key] ? 'text' : 'password'}
                          value={senha[key]}
                          onChange={e => setSenha(s => ({ ...s, [key]: e.target.value }))}
                          placeholder={ph}
                        />
                        <button type="button" className="input-suffix-btn"
                          onClick={() => toggleShow(key)}>
                          {showPwd[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Requisitos de senha */}
                <div className="acfg-pwd-reqs">
                  <span className="acfg-pwd-reqs-label">A senha deve conter:</span>
                  <div className="acfg-pwd-reqs-list">
                    {pwdReqs.map(r => (
                      <span key={r.key} className={`acfg-pwd-req${r.met ? ' met' : ''}`}>
                        <Check size={13} /> {r.label}
                      </span>
                    ))}
                  </div>
                </div>

                {pwdMsg.text && (
                  <p className={`acfg-pwd-msg${pwdMsg.ok ? ' ok' : ' err'}`}>{pwdMsg.text}</p>
                )}

                <button type="submit" className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} disabled={savingS}>
                  {savingS ? 'Alterando…' : 'Alterar senha'}
                </button>
              </form>
            </section>

            {/* ── 3. Configurações do sistema ── */}
            <section className="surface-card cfg-card">
              <SectionHeader
                icon={Settings}
                color="linear-gradient(135deg,#059669,#10b981)"
                title="Configurações do sistema"
                subtitle="Personalize o comportamento da área administrativa."
              />

              <div className="acfg-sys-grid">
                {/* Coluna 1 — toggles */}
                <div className="acfg-sys-col">
                  <ToggleRow
                    label="Notificações por e-mail"
                    desc="Receber notificações sobre novos cadastros e alterações."
                    checked={sysConfig.notifEmail}
                    onChange={v => setSysConfig(p => ({ ...p, notifEmail: v }))}
                  />
                  <ToggleRow
                    label="Aprovação automática"
                    desc="Aprovar novos usuários automaticamente (não recomendado)."
                    checked={sysConfig.aprovacaoAuto}
                    onChange={v => setSysConfig(p => ({ ...p, aprovacaoAuto: v }))}
                  />
                </div>

                {/* Coluna 2 — sessão + registro */}
                <div className="acfg-sys-col">
                  <div className="field">
                    <label className="field-label">Sessão administrativa</label>
                    <p className="cfg-toggle-desc" style={{ marginBottom: 8 }}>Encerrar sessão automaticamente após períodos de inatividade.</p>
                    <div className="input-shell">
                      <select value={sysConfig.sessaoTimeout}
                        onChange={e => setSysConfig(p => ({ ...p, sessaoTimeout: e.target.value }))}>
                        <option value="15">15 minutos</option>
                        <option value="30">30 minutos</option>
                        <option value="60">1 hora</option>
                        <option value="120">2 horas</option>
                        <option value="0">Nunca</option>
                      </select>
                    </div>
                  </div>
                  <ToggleRow
                    label="Registro de ações"
                    desc="Manter histórico de todas as ações administrativas."
                    checked={sysConfig.registroAcoes}
                    onChange={v => setSysConfig(p => ({ ...p, registroAcoes: v }))}
                  />
                </div>

                {/* Coluna 3 — fuso + idioma */}
                <div className="acfg-sys-col">
                  <div className="field">
                    <label className="field-label">Fuso horário</label>
                    <p className="cfg-toggle-desc" style={{ marginBottom: 8 }}>Defina o fuso horário da área administrativa.</p>
                    <div className="input-shell">
                      <select value={sysConfig.fusoHorario}
                        onChange={e => setSysConfig(p => ({ ...p, fusoHorario: e.target.value }))}>
                        <option value="America/Sao_Paulo">(GMT-03:00) Brasília</option>
                        <option value="America/Manaus">(GMT-04:00) Manaus</option>
                        <option value="America/Belem">(GMT-03:00) Belém</option>
                        <option value="America/Fortaleza">(GMT-03:00) Fortaleza</option>
                        <option value="America/Recife">(GMT-03:00) Recife</option>
                        <option value="America/Noronha">(GMT-02:00) Fernando de Noronha</option>
                      </select>
                    </div>
                  </div>
                  <div className="field" style={{ marginTop: 16 }}>
                    <label className="field-label">Idioma</label>
                    <p className="cfg-toggle-desc" style={{ marginBottom: 8 }}>Selecione o idioma da área administrativa.</p>
                    <div className="input-shell">
                      <select value={sysConfig.idioma}
                        onChange={e => setSysConfig(p => ({ ...p, idioma: e.target.value }))}>
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
