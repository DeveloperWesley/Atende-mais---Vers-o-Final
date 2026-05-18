import {
  Check, ChevronDown, MoreHorizontal, Play,
  Search, Shield, SlidersHorizontal, UserCheck,
  UserMinus, UserX, Users, X
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Header from '../components/Header.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

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

function ActionMenu({ onDisable, onReactivate }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button className="icon-btn" onClick={() => setOpen(o => !o)}>
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setOpen(false)} />
          <div className="admin-action-menu">
            {onDisable    && <button onClick={() => { onDisable();    setOpen(false); }}>Desativar</button>}
            {onReactivate && <button onClick={() => { onReactivate(); setOpen(false); }}>Reativar</button>}
          </div>
        </>
      )}
    </div>
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

export default function AdminDashboard() {
  const {
    usuarios, aprovarUsuario, rejeitarUsuario,
    desativarUsuario, reativarUsuario, startImpersonation,
  } = useAuth();
  const navigate = useNavigate();
  const { toasts, addToast } = useToast();

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

  function handleAprovar(u)  { aprovarUsuario(u.id);  addToast(`${u.nome} aprovado com sucesso!`, 'success'); }
  function handleRejeitar(u) { rejeitarUsuario(u.id); addToast(`Cadastro de ${u.nome} recusado.`, 'error'); }
  function handleReativar(u) { reativarUsuario(u.id); addToast(`${u.nome} reativado com sucesso!`, 'success'); }

  function handleDesativar(u) {
    setConfirm({
      title: 'Desativar usuário?',
      message: `${u.nome} não conseguirá fazer login no sistema.`,
      onConfirm: () => { desativarUsuario(u.id); addToast(`${u.nome} desativado.`, 'warning'); setConfirm(null); },
    });
  }

  function handleAcessar(u) { startImpersonation(u); navigate('/dashboard'); }

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="content-area">
        <Header title="Administração" subtitle="Gerencie usuários e controle o acesso ao sistema." />

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
                            <ActionMenu onDisable={() => handleDesativar(u)} />
                          )}
                          {u.status === 'inativo' && (
                            <button className="icon-btn admin-btn-reactivate" title="Reativar" onClick={() => handleReativar(u)}>
                              <Play size={14} />
                            </button>
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
          onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />
      )}
      <ToastList toasts={toasts} />
    </div>
  );
}
