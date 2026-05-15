import { Eye, Pencil, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AtendimentoForm from '../components/AtendimentoForm.jsx';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useData } from '../contexts/DataContext.jsx';

const PER_PAGE = 5;
const TABS = [
  { key: 'todos',    label: 'Todos' },
  { key: 'pendente', label: 'Pendentes' },
  { key: 'concluido',label: 'Concluídos' },
  { key: 'cancelado',label: 'Cancelados' },
];

const SIT_PILL = {
  pendente:  { cls: 'pill pill-orange', label: 'Pendente'  },
  concluido: { cls: 'pill pill-green',  label: 'Concluído' },
  cancelado: { cls: 'pill pill-red',    label: 'Cancelado' },
};
const REC_PILL = {
  pendente: { cls: 'pill pill-orange', label: 'Pendente' },
  recebido: { cls: 'pill pill-green',  label: 'Recebido' },
};
const DOC_PILL = {
  pendente: { cls: 'pill pill-orange', label: 'Pendente' },
  completa: { cls: 'pill pill-green',  label: 'Completa' },
};

function formatDate(value) {
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function Atendimentos() {
  const { atendimentos, addAtendimento, updateAtendimento, deleteAtendimento } = useData();
  const [tab, setTab]     = useState('todos');
  const [search, setSearch] = useState('');
  const [page, setPage]   = useState(1);
  const [modal, setModal] = useState({ open: false, editing: null });

  const filtered = atendimentos.filter((a) => {
    const matchTab = tab === 'todos' || a.situacao === tab;
    const q = search.toLowerCase();
    const matchSearch = !q || a.paciente.toLowerCase().includes(q) || a.pagador?.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function counts(key) {
    if (key === 'todos') return atendimentos.length;
    return atendimentos.filter((a) => a.situacao === key).length;
  }

  function closeModal() { setModal({ open: false, editing: null }); }

  function handleSubmit(payload) {
    const item = {
      data: formatDate(payload.dataAtendimento),
      hora: '—',
      paciente: payload.pacienteNome,
      pagador: payload.pagadorNome,
      cpfPaciente: payload.pacienteCpf,
      cpfPagador: payload.pagadorDoc,
      valorNum: parseFloat(String(payload.valorRecebido || '0').replace(',', '.')) || 0,
      valor: formatCurrency(parseFloat(String(payload.valorRecebido || '0').replace(',', '.')) || 0),
      situacao: 'pendente',
      recebimento: 'pendente',
      documentacao: payload.precisaDoc ? 'pendente' : 'completa',
      nfStatus: payload.precisaDoc ? 'pendente' : 'emitido',
      receitaSaude: 'pronto',
      ...payload,
    };
    if (modal.editing) updateAtendimento(modal.editing.id, item);
    else addAtendimento(item);
    closeModal();
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="content-area">
        <Header
          title="Atendimentos"
          subtitle="Gerencie e acompanhe todos os atendimentos realizados."
          actions={
            <button className="btn btn-primary btn-sm" onClick={() => setModal({ open: true, editing: null })}>
              <Plus size={15} /> Novo atendimento
            </button>
          }
        />

        <div className="main-content">
          <div className="surface-card page-table-card">
            {/* Toolbar */}
            <div className="page-toolbar">
              <span className="search-bar" style={{ minWidth: 300 }}>
                <Search size={15} />
                <input
                  placeholder="Buscar paciente, CPF ou pagador..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </span>
              <button className="btn btn-ghost btn-sm"><SlidersHorizontal size={15} /> Filtros</button>
            </div>

            {/* Tabs */}
            <div className="page-tabs">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`page-tab${tab === t.key ? ' active' : ''}`}
                  onClick={() => { setTab(t.key); setPage(1); }}
                >
                  {t.label}
                  <span className="page-tab-count">{counts(t.key)}</span>
                </button>
              ))}
            </div>

            {/* Tabela */}
            <div className="table-wrap">
              <table className="atendimento-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Paciente</th>
                    <th>Pagador</th>
                    <th>Valor</th>
                    <th>Situação</th>
                    <th>Recebimento</th>
                    <th>Documentação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((a) => {
                    const sit = SIT_PILL[a.situacao] || SIT_PILL.pendente;
                    const rec = REC_PILL[a.recebimento] || REC_PILL.pendente;
                    const doc = DOC_PILL[a.documentacao] || DOC_PILL.pendente;
                    return (
                      <tr key={a.id}>
                        <td className="table-cell-muted">{a.data}{a.hora ? ` · ${a.hora}` : ''}</td>
                        <td>{a.paciente}</td>
                        <td className="table-cell-muted">{a.pagador}</td>
                        <td><strong>{a.valor}</strong></td>
                        <td><span className={sit.cls}>{sit.label}</span></td>
                        <td><span className={rec.cls}>{rec.label}</span></td>
                        <td><span className={doc.cls}>{doc.label}</span></td>
                        <td>
                          <div className="table-actions">
                            <button className="icon-btn" title="Visualizar"><Eye size={15} /></button>
                            <button className="icon-btn" title="Editar" onClick={() => setModal({ open: true, editing: a })}><Pencil size={15} /></button>
                            <button className="icon-btn icon-btn-danger" title="Excluir" onClick={() => deleteAtendimento(a.id)}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paginated.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Nenhum atendimento encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="table-pagination">
              <span className="pagination-info">
                Mostrando {Math.min((page - 1) * PER_PAGE + 1, filtered.length)} a {Math.min(page * PER_PAGE, filtered.length)} de {filtered.length} atendimentos
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>›</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modal.open && (
        <div className="modal-backdrop">
          <section className="modal-panel surface-card">
            <div className="modal-heading">
              <h2>{modal.editing ? 'Editar atendimento' : 'Novo atendimento'}</h2>
              <p>Registre os dados necessários para controle fiscal e financeiro.</p>
            </div>
            <AtendimentoForm initialValues={modal.editing} onCancel={closeModal} onSubmit={handleSubmit} />
          </section>
        </div>
      )}
    </div>
  );
}
