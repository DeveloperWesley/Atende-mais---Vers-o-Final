import { Pencil, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useData } from '../contexts/DataContext.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';

const PER_PAGE = 5;

const EMPTY = { nome: '', cpf: '', telefone: '', email: '' };

function onlyDigits(v) { return String(v || '').replace(/\D/g, ''); }

function maskPhone(value) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)})${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)})${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)})${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCpf(value) {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function isValidPhone(v) { const d = onlyDigits(v); return d.length === 10 || d.length === 11; }
function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }

function normalizePacienteInitial(initial) {
  if (!initial) return EMPTY;
  return {
    nome: initial.nome || '',
    cpf: maskCpf(initial.cpf || ''),
    telefone: maskPhone(initial.telefone || ''),
    email: initial.email || '',
  };
}

function PacienteForm({ initial, onCancel, onSubmit }) {
  const [values, setValues] = useState(() => normalizePacienteInitial(initial));
  const [errors, setErrors] = useState({});

  function set(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!values.nome.trim())                              errs.nome     = 'Campo obrigatório';
    if (!values.cpf.trim())                               errs.cpf      = 'Campo obrigatório';
    if (values.telefone && !isValidPhone(values.telefone)) errs.telefone = 'Telefone inválido. Ex: (84)98872-7383';
    if (values.email && !isValidEmail(values.email))      errs.email    = 'E-mail inválido.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 }}>
      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label className="field-label">Nome completo *</label>
          <div className={`input-shell${errors.nome ? ' input-error' : ''}`}>
            <input
              value={values.nome}
              onChange={(e) => set('nome', e.target.value)}
              placeholder="Ex: Maria Oliveira"
            />
          </div>
          {errors.nome && <span className="field-error">{errors.nome}</span>}
        </div>

        <div className="field">
          <label className="field-label">CPF *</label>
          <div className={`input-shell${errors.cpf ? ' input-error' : ''}`}>
            <input
              value={values.cpf}
              onChange={(e) => set('cpf', maskCpf(e.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
          </div>
          {errors.cpf && <span className="field-error">{errors.cpf}</span>}
        </div>

        <div className="field">
          <label className="field-label">Telefone</label>
          <div className={`input-shell${errors.telefone ? ' input-error' : ''}`}>
            <input
              value={values.telefone}
              onChange={(e) => set('telefone', maskPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              inputMode="tel"
            />
          </div>
          {errors.telefone && <span className="field-error">{errors.telefone}</span>}
        </div>

        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label className="field-label">E-mail</label>
          <div className={`input-shell${errors.email ? ' input-error' : ''}`}>
            <input
              type="email"
              value={values.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="paciente@email.com"
            />
          </div>
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary btn-sm">Salvar</button>
      </div>
    </form>
  );
}

export default function Pacientes() {
  const { pacientes, addPaciente, updatePaciente, deletePaciente } = useData();
  const { settings } = useSettings();
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);
  const [confirmId, setConfirmId] = useState(null);
  const [modal, setModal]   = useState({ open: false, editing: null });

  const filtered = pacientes.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.nome.toLowerCase().includes(q) || p.cpf.includes(q) || p.email?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function closeModal() { setModal({ open: false, editing: null }); }

  function handleSubmit(values) {
    if (modal.editing) updatePaciente(modal.editing.id, values);
    else addPaciente({ ...values, ultimoAtendimento: '—' });
    closeModal();
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="content-area">
        <Header
          title="Pacientes"
          subtitle="Gerencie e acompanhe seus pacientes."
          actions={
            <button className="btn btn-primary btn-sm" onClick={() => setModal({ open: true, editing: null })}>
              <Plus size={15} /> Novo paciente
            </button>
          }
        />

        <div className="main-content">
          <div className="surface-card page-table-card">

            <div className="page-toolbar">
              <span className="search-bar" style={{ minWidth: 300 }}>
                <Search size={15} />
                <input
                  placeholder="Buscar paciente..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </span>
              <button className="btn btn-ghost btn-sm"><SlidersHorizontal size={15} /> Filtros</button>
            </div>

            <div className="table-wrap">
              <table className="atendimento-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Telefone</th>
                    <th>E-mail</th>
                    <th>Último atendimento</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p) => (
                    <tr key={p.id}>
                      <td className="td-main">{p.nome}</td>
                      <td data-label="CPF" className="table-cell-muted">{p.cpf}</td>
                      <td data-label="Telefone" className="table-cell-muted">{p.telefone || '—'}</td>
                      <td data-label="E-mail" className="table-cell-muted">{p.email || '—'}</td>
                      <td data-label="Último atend." className="table-cell-muted">{p.ultimoAtendimento || '—'}</td>
                      <td className="td-actions">
                        <div className="table-actions">
                          <button className="icon-btn" title="Editar"
                            onClick={() => setModal({ open: true, editing: p })}>
                            <Pencil size={15} />
                          </button>
                          <button className="icon-btn icon-btn-danger" title="Excluir"
                            onClick={() => settings.confirmarExclusao ? setConfirmId(p.id) : deletePaciente(p.id)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        Nenhum paciente encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-pagination">
              <span className="pagination-info">
                Mostrando {Math.min((page - 1) * PER_PAGE + 1, filtered.length)} a {Math.min(page * PER_PAGE, filtered.length)} de {filtered.length} pacientes
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} className={`page-btn${n === page ? ' active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                ))}
                <button className="page-btn" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>›</button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {confirmId !== null && (
        <ConfirmDialog
          title="Excluir paciente?"
          message="Todos os dados deste paciente serão removidos. Esta ação não pode ser desfeita."
          onConfirm={() => { deletePaciente(confirmId); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {modal.open && (
        <div className="modal-backdrop">
          <section className="modal-panel surface-card">
            <div className="modal-heading">
              <h2>{modal.editing ? 'Editar paciente' : 'Novo paciente'}</h2>
              <p>Preencha os dados do paciente para cadastro.</p>
            </div>
            <PacienteForm
              initial={modal.editing}
              onCancel={closeModal}
              onSubmit={handleSubmit}
            />
          </section>
        </div>
      )}
    </div>
  );
}
