import {
  Camera, ChevronRight, Lock, LogOut,
  Monitor, Save, Settings, Shield, User
} from 'lucide-react';
import { useRef, useState } from 'react';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { api } from '../services/api.js';

const PROFISSOES = [
  'Psicólogo','Nutricionista','Médico','Fonoaudiólogo','Fisioterapeuta',
  'Dentista','Terapeuta ocupacional','Enfermeiro','Biomédico',
  'Farmacêutico','Personal trainer','Outro',
];

function maskPhone(v) {
  const d = v.replace(/\D/g,'').slice(0,11);
  if (d.length <= 2)  return `(${d}`;
  if (d.length <= 6)  return `(${d.slice(0,2)})${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)})${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)})${d.slice(2,7)}-${d.slice(7)}`;
}

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

/* ── Modal de alterar senha ── */
function SenhaModal({ onClose }) {
  const [form,    setForm]    = useState({ atual: '', nova: '', confirma: '' });
  const [erro,    setErro]    = useState('');
  const [ok,      setOk]      = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (!form.atual || !form.nova) { setErro('Preencha todos os campos.'); return; }
    if (form.nova.length < 6)      { setErro('Nova senha: mínimo 6 caracteres.'); return; }
    if (form.nova !== form.confirma){ setErro('As senhas não coincidem.'); return; }
    setErro('');
    setLoading(true);
    try {
      await api.alterarSenha({ senhaAtual: form.atual, novaSenha: form.nova });
      setOk(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      setErro(err.message || 'Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal-panel surface-card" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-heading">
          <h2>Alterar senha</h2>
          <p>Escolha uma senha segura com pelo menos 6 caracteres.</p>
        </div>
        {ok
          ? <p style={{ color:'var(--green)', fontWeight:600, textAlign:'center', padding:'20px 0' }}>Senha alterada com sucesso!</p>
          : <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14, marginTop:8 }}>
              {erro && <div className="form-error">{erro}</div>}
              <div className="field">
                <label className="field-label">Senha atual</label>
                <div className="input-shell"><input type="password" value={form.atual} onChange={e=>setForm(f=>({...f,atual:e.target.value}))} placeholder="••••••••" /></div>
              </div>
              <div className="field">
                <label className="field-label">Nova senha</label>
                <div className="input-shell"><input type="password" value={form.nova} onChange={e=>setForm(f=>({...f,nova:e.target.value}))} placeholder="••••••••" /></div>
              </div>
              <div className="field">
                <label className="field-label">Confirmar nova senha</label>
                <div className="input-shell"><input type="password" value={form.confirma} onChange={e=>setForm(f=>({...f,confirma:e.target.value}))} placeholder="••••••••" /></div>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>{loading ? 'Salvando…' : 'Salvar senha'}</button>
              </div>
            </form>
        }
      </section>
    </div>
  );
}

/* ════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ════════════════════════════════════════ */
export default function Configuracoes() {
  const { settings, saveSettings, setDisplayPreview } = useSettings();
  const { theme, setTheme }        = useTheme();
  const avatarRef = useRef(null);

  const [form, setForm]   = useState({ ...settings });
  const [saved, setSaved] = useState(false);
  const [senhaModal, setSenhaModal] = useState(false);

  function set(field) {
    return (e) => {
      const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm(f => ({ ...f, [field]: val }));
      /* Atualiza sidebar instantaneamente para nome e sexo */
      if (field === 'nome' || field === 'sexo') {
        setDisplayPreview({ [field]: val });
      }
    };
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const base64 = ev.target.result;
      setForm(f => ({ ...f, avatar: base64 }));
      saveSettings({ avatar: base64 }); /* atualiza sidebar imediatamente */
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    const selectedTheme = form.tema || theme;
    if (selectedTheme !== theme) setTheme(selectedTheme);
    saveSettings({ ...form, tema: selectedTheme });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function getInitials(nome) {
    const parts = (nome||'').trim().split(' ').filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="content-area">
        <Header
          title="Configurações"
          subtitle="Gerencie suas informações e preferências do sistema."
          actions={
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              <Save size={15} />
              {saved ? 'Salvo!' : 'Salvar alterações'}
            </button>
          }
        />

        <div className="main-content">
          <div className="cfg-page">

            {/* ══ 1. PERFIL PROFISSIONAL ══ */}
            <section className="surface-card cfg-card">
              <SectionHeader
                icon={User}
                color="linear-gradient(135deg,#6c5ce7,#a855f7)"
                title="Perfil profissional"
                subtitle="Atualize suas informações pessoais e profissionais."
              />

              {/* Avatar */}
              <div className="cfg-avatar-row">
                <div className="cfg-avatar-wrap" onClick={() => avatarRef.current?.click()}>
                  {form.avatar
                    ? <img src={form.avatar} alt="Avatar" className="cfg-avatar-img" />
                    : <div className="cfg-avatar-placeholder">{getInitials(form.nome)}</div>
                  }
                  <div className="cfg-avatar-overlay"><Camera size={18} /></div>
                </div>
                <div className="cfg-avatar-info">
                  <button type="button" className="btn btn-ghost btn-sm"
                    onClick={() => avatarRef.current?.click()}>
                    <Camera size={14} /> Alterar foto
                  </button>
                  <span className="cfg-avatar-hint">JPG ou PNG · máx. 2MB</span>
                </div>
                <input ref={avatarRef} type="file" accept="image/jpeg,image/png"
                  style={{ display:'none' }} onChange={handleAvatarChange} />
              </div>

              {/* Campos */}
              <div className="cfg-fields-grid">
                <div className="field">
                  <label className="field-label">Nome</label>
                  <div className="input-shell">
                    <input value={form.nome} onChange={set('nome')} placeholder="Seu nome completo" />
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Sexo</label>
                  <div className="input-shell">
                    <select value={form.sexo} onChange={set('sexo')}>
                      <option>Masculino</option>
                      <option>Feminino</option>
                      <option>Não informar</option>
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Profissão</label>
                  <div className="input-shell">
                    <select value={form.profissao} onChange={set('profissao')}>
                      {PROFISSOES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Número do conselho profissional</label>
                  <div className="input-shell">
                    <input value={form.conselho} onChange={set('conselho')} placeholder="Ex: 06/123456" />
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Telefone</label>
                  <div className="input-shell">
                    <input value={form.telefone}
                      onChange={e => setForm(f => ({ ...f, telefone: maskPhone(e.target.value) }))}
                      placeholder="(00) 00000-0000" inputMode="tel" />
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">E-mail</label>
                  <div className="input-shell">
                    <input type="email" value={form.email} onChange={set('email')} placeholder="seu@email.com" />
                  </div>
                </div>
              </div>
            </section>

            {/* ══ 2. PREFERÊNCIAS DO SISTEMA ══ */}
            <section className="surface-card cfg-card">
              <SectionHeader
                icon={Settings}
                color="linear-gradient(135deg,#2563eb,#6366f1)"
                title="Preferências do sistema"
                subtitle="Personalize sua experiência no sistema."
              />

              <div className="cfg-fields-grid">
                <div className="field">
                  <label className="field-label">Tema</label>
                  <div className="input-shell">
                    <Monitor size={17} strokeWidth={1.8} />
                    <select value={form.tema || theme}
                      onChange={e => setForm(f => ({ ...f, tema: e.target.value }))}>
                      <option value="dark">Escuro</option>
                      <option value="light">Claro</option>
                    </select>
                  </div>
                </div>

                <div className="field cfg-toggle-field" style={{ gridColumn:'1 / -1' }}>
                  <div className="cfg-toggle-row">
                    <div>
                      <span className="field-label">Confirmar exclusão de registros</span>
                      <p className="cfg-toggle-desc">Exibir confirmação antes de excluir atendimentos ou despesas</p>
                    </div>
                    <label className="cfg-toggle-switch">
                      <input type="checkbox" checked={form.confirmarExclusao} onChange={set('confirmarExclusao')} />
                      <span className="cfg-toggle-track" />
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* ══ 3. SEGURANÇA DA CONTA ══ */}
            <section className="surface-card cfg-card">
              <SectionHeader
                icon={Shield}
                color="linear-gradient(135deg,#059669,#10b981)"
                title="Segurança da conta"
                subtitle="Gerencie a segurança da sua conta."
              />

              <div className="cfg-security-list">
                <button className="cfg-security-item" onClick={() => setSenhaModal(true)}>
                  <div className="cfg-security-icon"><Lock size={18} /></div>
                  <div className="cfg-security-text">
                    <strong>Alterar senha</strong>
                    <span>Atualize sua senha de acesso</span>
                  </div>
                  <ChevronRight size={18} className="cfg-security-chevron" />
                </button>

                <button className="cfg-security-item" onClick={() => alert('Todas as outras sessões foram encerradas.')}>
                  <div className="cfg-security-icon"><LogOut size={18} /></div>
                  <div className="cfg-security-text">
                    <strong>Logout de outros dispositivos</strong>
                    <span>Encerre todas as outras sessões ativas</span>
                  </div>
                  <ChevronRight size={18} className="cfg-security-chevron" />
                </button>
              </div>
            </section>

          </div>
        </div>
      </div>

      {senhaModal && <SenhaModal onClose={() => setSenhaModal(false)} />}
    </div>
  );
}
