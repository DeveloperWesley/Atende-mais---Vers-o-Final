import {
  Bell, Check, ChevronDown, MoreHorizontal, Play,
  Search, Send, Shield, SlidersHorizontal, UserCheck,
  UserX, Users, X
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Header from '../components/Header.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNotifications } from '../contexts/NotificationsContext.jsx';

const PER_PAGE = 7;

const PROFISSOES = [
  'Psicologia','Nutrição','Fisioterapia','Medicina','Fonoaudiologia',
  'Odontologia','Terapia Ocupacional','Enfermagem','Biomedicina',
  'Farmácia','Personal trainer','Outro',
];

const PALETTE = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2','#9333ea','#16a34a'];
function avatarColor(nome = '') {
  let h = 0; for (let i = 0; i < nome.length; i++) h = nome.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}
function getInitials(nome = '') {
  const p = nome.trim().split(' ').filter(Boolean);
  if (!p.length) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  function addToast(msg, type = 'success') {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }
  return { toasts, addToast };
}

function ToastList({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="admin-toasts">
      {toasts.map(t => (
        <div key={t.id} className={`admin-toast admin-toast-${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}

function ActionMenu({ onDisable, onReactivate, onDelete }) {
  const [pos, setPos] = useState(null);

  function handleClick(e) {
    if (pos) { setPos(null); return; }
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  const menuStyle = {
    position: 'fixed',
    top: pos?.top,
    right: pos?.right,
    zIndex: 99999,
    minWidth: 150,
    borderRadius: 8,
    overflow: 'hidden',
    background: isDark ? '#0f1e38' : '#ffffff',
    border: isDark ? '1px solid rgba(143,167,214,0.35)' : '1px solid #e5e7eb',
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.7)' : '0 8px 24px rgba(0,0,0,0.12)',
  };

  const btnBase = {
    display: 'block', width: '100%', padding: '11px 16px',
    background: 'none', border: 'none', fontSize: '0.84rem',
    fontWeight: 600, cursor: 'pointer', textAlign: 'left',
  };

  return (
    <>
      <button className="icon-btn" onClick={handleClick}>
        <MoreHorizontal size={16} />
      </button>

      {pos && createPortal(
        <>
          <div style={{ position:'fixed', inset:0, zIndex:99998 }} onClick={() => setPos(null)} />
          <div style={menuStyle}>
            {onDisable && (
              <button
                style={{ ...btnBase, color: isDark ? '#ff6b7a' : '#dc2626' }}
                onClick={() => { onDisable(); setPos(null); }}
              >
                Desativar
              </button>
            )}
            {onDelete && (
              <button
                style={{ ...btnBase, color: isDark ? '#ff6b7a' : '#dc2626', borderTop: isDark?'1px solid rgba(255,255,255,0.08)':'1px solid #f3f4f6' }}
                onClick={() => { onDelete(); setPos(null); }}
              >
                Excluir cadastro
              </button>
            )}
            {onReactivate && (
              <button
                style={{ ...btnBase, color: isDark ? '#22d886' : '#059669' }}
                onClick={() => { onReactivate(); setPos(null); }}
              >
                Reativar
              </button>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  );
}

function StatusBadge({ status }) {
  const map = {
    ativo:    { cls: 'admin-badge-green',  label: 'Ativo'      },
    pendente: { cls: 'admin-badge-yellow', label: 'Pendente'   },
    inativo:  { cls: 'admin-badge-red',    label: 'Desativado' },
  };
  const { cls, label } = map[status] || map.inativo;
  return (
    <span className={`admin-status-badge ${cls}`}>
      <span className="admin-badge-dot" />{label}
    </span>
  );
}

/* ── Modal de envio de notificação ── */
function SendNotifModal({ usuarios, onClose, onSend }) {
  const [dest,  setDest]  = useState('all');
  const [userId,setUserId]= useState('');
  const [texto, setTexto] = useState('');

  const ativos = usuarios.filter(u => u.status === 'ativo');

  function handleSend(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    const ids = dest === 'all' ? ativos.map(u => u.id) : [Number(userId)];
    onSend(ids, texto.trim());
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal-panel surface-card" style={{ maxWidth:480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-heading">
          <h2>Enviar notificação</h2>
          <p>A notificação aparecerá no sino dos usuários selecionados.</p>
        </div>
        <form onSubmit={handleSend} style={{ display:'flex', flexDirection:'column', gap:16, marginTop:8 }}>
          <div className="field">
            <label className="field-label">Destinatário</label>
            <div className="input-shell">
              <select value={dest} onChange={e => setDest(e.target.value)}>
                <option value="all">Todos os usuários ativos ({ativos.length})</option>
                <option value="one">Usuário específico</option>
              </select>
            </div>
          </div>

          {dest === 'one' && (
            <div className="field">
              <label className="field-label">Selecionar usuário</label>
              <div className="input-shell">
                <select value={userId} onChange={e => setUserId(e.target.value)} required>
                  <option value="">Selecione…</option>
                  {ativos.map(u => (
                    <option key={u.id} value={u.id}>{u.nome} — {u.especialidade}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="field">
            <label className="field-label">Mensagem</label>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Digite a mensagem da notificação…"
              rows={3}
              required
            />
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm">
              <Send size={14} /> Enviar notificação
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

/* ── Card de envio de notificações ── */
function NotifComposeCard({ professionals, sendToUser, sendToAll, addToast }) {
  const [dest,  setDest]  = useState('all');
  const [userId,setUserId]= useState('');
  const [texto, setTexto] = useState('');
  const [sending,setSending]=useState(false);

  const ativos = professionals.filter(u => u.status === 'ativo');

  async function handleSend(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    setSending(true);
    const ids = dest === 'all' ? ativos.map(u => u.id) : [Number(userId)];
    if (dest === 'one') await sendToUser(ids[0], texto.trim());
    else await sendToAll(ids, texto.trim());
    addToast(`Notificação enviada para ${dest === 'all' ? `${ativos.length} usuário(s)` : ativos.find(u=>u.id===Number(userId))?.nome || 'usuário'}!`, 'success');
    setTexto('');
    setSending(false);
  }

  return (
    <div className="surface-card admin-notif-compose">
      <div className="admin-notif-compose-header">
        <Bell size={18} />
        <strong>Enviar notificação</strong>
        <span className="admin-notif-compose-sub">A mensagem aparecerá no sino dos usuários selecionados</span>
      </div>

      <form onSubmit={handleSend} className="admin-notif-compose-form">
        <div className="admin-notif-compose-row">
          {/* Destinatário */}
          <div className="desp-filter-select-wrap" style={{ minWidth: 200 }}>
            <Users size={13} className="desp-filter-icon" />
            <select className="desp-filter-select" value={dest} onChange={e => setDest(e.target.value)}>
              <option value="all">Todos os usuários ativos ({ativos.length})</option>
              <option value="one">Usuário específico</option>
            </select>
            <ChevronDown size={12} className="desp-filter-chevron" />
          </div>

          {dest === 'one' && (
            <div className="desp-filter-select-wrap" style={{ minWidth: 220 }}>
              <Users size={13} className="desp-filter-icon" />
              <select className="desp-filter-select" value={userId} onChange={e => setUserId(e.target.value)} required>
                <option value="">Selecione o usuário…</option>
                {ativos.map(u => (
                  <option key={u.id} value={u.id}>{u.nome} — {u.especialidade}</option>
                ))}
              </select>
              <ChevronDown size={12} className="desp-filter-chevron" />
            </div>
          )}
        </div>

        <div className="admin-notif-compose-msg">
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Digite a mensagem da notificação…"
            rows={2}
            required
          />
          <button type="submit" className="btn btn-primary btn-sm admin-notif-send-btn" disabled={sending || !texto.trim()}>
            <Send size={14} /> {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminDashboard() {
  const {
    usuarios, aprovarUsuario, rejeitarUsuario,
    desativarUsuario, reativarUsuario, excluirUsuario, startImpersonation,
  } = useAuth();
  const { sendToUser, sendToAll } = useNotifications();
  const navigate = useNavigate();
  const { toasts, addToast } = useToast();
  const [notifModal, setNotifModal] = useState(false);

  const [search,       setSearch]  = useState('');
  const [filterStatus, setFStatus] = useState('');
  const [filterProf,   setFProf]   = useState('');
  const [page,         setPage]    = useState(1);
  const [confirm,      setConfirm] = useState(null);

  const professionals = useMemo(() => usuarios.filter(u => u.perfil !== 'admin'), [usuarios]);

  const countAtivos    = professionals.filter(u => u.status === 'ativo').length;
  const countPendentes = professionals.filter(u => u.status === 'pendente').length;
  const countInativos  = professionals.filter(u => u.status === 'inativo').length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return professionals.filter(u =>
      (!q            || u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (!filterStatus || u.status === filterStatus) &&
      (!filterProf   || u.especialidade === filterProf)
    );
  }, [professionals, search, filterStatus, filterProf]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function clearFilters() { setSearch(''); setFStatus(''); setFProf(''); setPage(1); }

  function handleAprovar(u) {
    aprovarUsuario(u.id);
    addToast(`${u.nome} aprovado com sucesso!`, 'success');
  }
  function handleRejeitar(u) {
    rejeitarUsuario(u.id);
    addToast(`Cadastro de ${u.nome} recusado.`, 'error');
  }
  function handleReativar(u) {
    reativarUsuario(u.id);
    addToast(`${u.nome} reativado com sucesso!`, 'success');
  }

  function handleExcluir(u) {
    setConfirm({
      title: 'Excluir cadastro?',
      message: `O cadastro de ${u.nome} será removido permanentemente. O usuário poderá se cadastrar novamente com o mesmo e-mail.`,
      onConfirm: async () => {
        await excluirUsuario(u.id);
        addToast(`Cadastro de ${u.nome} excluído.`, 'warning');
        setConfirm(null);
      },
    });
  }

  function handleSendNotif(userIds, texto) {
    if (userIds.length === 1) sendToUser(userIds[0], texto);
    else sendToAll(userIds, texto);
    addToast('Notificação enviada com sucesso!', 'success');
  }

  function handleDesativar(u) {
    setConfirm({
      title: 'Desativar usuário?',
      message: `${u.nome} não conseguirá fazer login no sistema.`,
      confirmLabel: 'Desativar',
      onConfirm: () => { desativarUsuario(u.id); addToast(`${u.nome} desativado.`, 'warning'); setConfirm(null); },
    });
  }

  function handleAcessar(u) { startImpersonation(u); navigate('/dashboard'); }

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="content-area">
        <Header
          title="Administração"
          subtitle="Gerencie usuários e controle o acesso ao sistema."
          actions={
            <button className="btn btn-primary btn-sm" onClick={() => setNotifModal(true)}>
              <Bell size={15} /> Enviar notificação
            </button>
          }
        />

        <div className="main-content">

          {/* ── Cards superiores ── */}
          <div className="admin-stats-row">
            <div className="surface-card admin-stat-card">
              <div className="admin-stat-icon" style={{ background:'linear-gradient(135deg,#6c5ce7,#a855f7)' }}>
                <UserCheck size={22} color="#fff" />
              </div>
              <div className="admin-stat-info">
                <strong>{countAtivos}</strong>
                <span>Usuários ativos</span>
                <small style={{ color:'var(--green)', fontWeight:600 }}>Acessos liberados</small>
              </div>
            </div>

            <div className="surface-card admin-stat-card">
              <div className="admin-stat-icon" style={{ background:'linear-gradient(135deg,#d97706,#f59e0b)' }}>
                <Users size={22} color="#fff" />
              </div>
              <div className="admin-stat-info">
                <strong>{countPendentes}</strong>
                <span>Pendentes de aprovação</span>
                <small style={{ color:'var(--orange)', fontWeight:600 }}>Aguardando aprovação</small>
              </div>
            </div>

            <div className="surface-card admin-stat-card">
              <div className="admin-stat-icon" style={{ background:'linear-gradient(135deg,#dc2626,#ef4444)' }}>
                <UserX size={22} color="#fff" />
              </div>
              <div className="admin-stat-info">
                <strong>{countInativos}</strong>
                <span>Usuários desativados</span>
                <small style={{ color:'var(--red)', fontWeight:600 }}>Inativos no sistema</small>
              </div>
            </div>
          </div>

          {/* ── Card envio de notificações ── */}
          <NotifComposeCard professionals={professionals} sendToUser={sendToUser} sendToAll={sendToAll} addToast={addToast} />

          {/* ── Filtros ── */}
          <div className="surface-card admin-filter-card">
            <div className="admin-filter-bar">
              <span className="search-bar admin-search">
                <Search size={15} />
                <input placeholder="Digite o nome ou e-mail do profissional..."
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </span>

              <div className="desp-filter-select-wrap" style={{ minWidth: 160 }}>
                <SlidersHorizontal size={13} className="desp-filter-icon" />
                <select className="desp-filter-select" value={filterStatus}
                  onChange={e => { setFStatus(e.target.value); setPage(1); }}>
                  <option value="">Status: Todos</option>
                  <option value="ativo">Ativo</option>
                  <option value="pendente">Pendente</option>
                  <option value="inativo">Desativado</option>
                </select>
                <ChevronDown size={12} className="desp-filter-chevron" />
              </div>

              <div className="desp-filter-select-wrap" style={{ minWidth: 180 }}>
                <Shield size={13} className="desp-filter-icon" />
                <select className="desp-filter-select" value={filterProf}
                  onChange={e => { setFProf(e.target.value); setPage(1); }}>
                  <option value="">Profissão: Todas</option>
                  {PROFISSOES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown size={12} className="desp-filter-chevron" />
              </div>

              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                <X size={14} /> Limpar filtros
              </button>
            </div>
          </div>

          {/* ── Tabela ── */}
          <div className="surface-card admin-table-card">
            <div className="table-wrap">
              <table className="atendimento-table admin-table">
                <thead>
                  <tr>
                    <th>Profissional</th>
                    <th>Profissão</th>
                    <th>Status</th>
                    <th>Plano</th>
                    <th>Último acesso</th>
                    <th>Atendimentos</th>
                    <th>Faturamento</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(u => (
                    <tr key={u.id}>
                      <td className="td-main">
                        <div className="at-patient-cell">
                          <span className="at-avatar" style={{ background: avatarColor(u.nome) }}>
                            {getInitials(u.nome)}
                          </span>
                          <div>
                            <div style={{ fontWeight:600 }}>{u.nome}</div>
                            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Profissão" className="table-cell-muted">{u.especialidade}</td>
                      <td data-label="Status"><StatusBadge status={u.status} /></td>
                      <td data-label="Plano">
                        <span className={`admin-plan-badge ${u.plano === 'Premium' ? 'admin-plan-premium' : 'admin-plan-basic'}`}>
                          {u.plano}
                        </span>
                      </td>
                      <td data-label="Último acesso" className="table-cell-muted">{u.ultimoAcesso}</td>
                      <td data-label="Atendimentos" style={{ fontWeight:600 }}>{u.totalAtendimentos}</td>
                      <td data-label="Faturamento" style={{ fontWeight:600 }}>{u.totalFaturamento}</td>
                      <td className="td-actions">
                        <div className="admin-actions-cell">
                          <button className="btn admin-btn-profile btn-sm" onClick={() => handleAcessar(u)}>
                            <UserCheck size={13} /> Acessar perfil
                          </button>
                          {u.status === 'pendente' && (<>
                            <button className="icon-btn admin-btn-approve" title="Aprovar" onClick={() => handleAprovar(u)}><Check size={15} /></button>
                            <button className="icon-btn admin-btn-reject"  title="Recusar" onClick={() => handleRejeitar(u)}><X size={15} /></button>
                          </>)}
                          {u.status === 'ativo' && (
                            <ActionMenu
                              onDisable={() => handleDesativar(u)}
                              onDelete={() => handleExcluir(u)}
                            />
                          )}
                          {u.status === 'inativo' && (
                            <>
                              <button className="icon-btn admin-btn-reactivate" title="Reativar" onClick={() => handleReativar(u)}>
                                <Play size={14} />
                              </button>
                              <ActionMenu onDelete={() => handleExcluir(u)} />
                            </>
                          )}
                          {u.status === 'pendente' && (
                            <ActionMenu onDelete={() => handleExcluir(u)} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)' }}>
                      Nenhum profissional encontrado
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-pagination">
              <span className="pagination-info">
                Mostrando {filtered.length === 0 ? 0 : Math.min((page-1)*PER_PAGE+1, filtered.length)} a {Math.min(page*PER_PAGE, filtered.length)} de {filtered.length} usuários
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page===1} onClick={() => setPage(page-1)}>‹</button>
                {Array.from({ length: totalPages }, (_,i) => i+1).map(p => (
                  <button key={p} className={`page-btn${p===page?' active':''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={page===totalPages||totalPages===0} onClick={() => setPage(page+1)}>›</button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {confirm && (
        <ConfirmDialog title={confirm.title} message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />
      )}
      {notifModal && (
        <SendNotifModal
          usuarios={professionals}
          onClose={() => setNotifModal(false)}
          onSend={handleSendNotif}
        />
      )}
      <ToastList toasts={toasts} />
    </div>
  );
}
