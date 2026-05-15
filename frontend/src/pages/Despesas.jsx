import { Eye, FileText, Pencil, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useData } from '../contexts/DataContext.jsx';

const CATEGORIAS = ['Aluguel', 'Serviços', 'Materiais', 'Transporte', 'Utilidades', 'Bancário', 'Marketing', 'Educação', 'Outros'];
const FORMAS_PAG = ['Pix', 'Débito', 'Crédito', 'Dinheiro', 'Transferência'];
const PER_PAGE = 5;

function fmt(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function DespesaModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || {
    data: '', descricao: '', categoria: 'Serviços',
    valorNum: '', formaPagamento: 'Pix', comprovante: false,
  });

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  }

  function handleSave(e) {
    e.preventDefault();
    const num = parseFloat(String(form.valorNum).replace(',', '.')) || 0;
    onSave({ ...form, valorNum: num, valor: fmt(num) });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal-panel surface-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-heading">
          <h2>{initial ? 'Editar despesa' : 'Nova despesa'}</h2>
          <p>Registre os dados da despesa do consultório.</p>
        </div>
        <form className="attendance-form" onSubmit={handleSave}>
          <div className="form-grid">
            <label className="field">
              <span className="field-label">Data</span>
              <span className="input-shell"><input type="date" value={form.data} onChange={set('data')} required /></span>
            </label>
            <label className="field">
              <span className="field-label">Categoria</span>
              <span className="input-shell">
                <select value={form.categoria} onChange={set('categoria')}>
                  {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </span>
            </label>
            <label className="field field-full">
              <span className="field-label">Descrição</span>
              <span className="input-shell"><input type="text" placeholder="Ex: Aluguel sala comercial" value={form.descricao} onChange={set('descricao')} required /></span>
            </label>
            <label className="field">
              <span className="field-label">Valor (R$)</span>
              <span className="input-shell"><input type="text" placeholder="0,00" value={form.valorNum} onChange={set('valorNum')} required /></span>
            </label>
            <label className="field">
              <span className="field-label">Forma de pagamento</span>
              <span className="input-shell">
                <select value={form.formaPagamento} onChange={set('formaPagamento')}>
                  {FORMAS_PAG.map((f) => <option key={f}>{f}</option>)}
                </select>
              </span>
            </label>
            <label className="check-card">
              <input type="checkbox" checked={form.comprovante} onChange={set('comprovante')} />
              Comprovante anexado
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar despesa</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function Despesas() {
  const { despesas, addDespesa, updateDespesa, deleteDespesa } = useData();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState({ open: false, editing: null });

  const filtered = despesas.filter((d) =>
    d.descricao.toLowerCase().includes(search.toLowerCase()) ||
    d.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalNum   = despesas.reduce((s, d) => s + d.valorNum, 0);

  function closeModal() { setModal({ open: false, editing: null }); }

  function handleSave(data) {
    if (modal.editing) updateDespesa(modal.editing.id, data);
    else addDespesa(data);
    closeModal();
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="content-area">
        <Header
          title="Despesas"
          subtitle={`${despesas.length} despesas · Total: ${fmt(totalNum)}`}
          actions={
            <button className="btn btn-primary btn-sm" onClick={() => setModal({ open: true, editing: null })}>
              <Plus size={15} /> Nova despesa
            </button>
          }
        />

        <div className="main-content">
          <div className="surface-card page-table-card">
            {/* Toolbar */}
            <div className="page-toolbar">
              <span className="search-bar" style={{ minWidth: 280 }}>
                <Search size={15} />
                <input
                  placeholder="Buscar descrição ou categoria..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </span>
              <button className="btn btn-ghost btn-sm"><SlidersHorizontal size={15} /> Filtros</button>
            </div>

            {/* Tabela */}
            <div className="table-wrap">
              <table className="atendimento-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Valor</th>
                    <th>Forma de pagamento</th>
                    <th>Comprovante</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((d) => (
                    <tr key={d.id}>
                      <td className="table-cell-muted">{d.data}</td>
                      <td><strong>{d.descricao}</strong></td>
                      <td className="table-cell-muted">{d.categoria}</td>
                      <td><strong>{d.valor}</strong></td>
                      <td className="table-cell-muted">{d.formaPagamento}</td>
                      <td>
                        {d.comprovante
                          ? <span className="pill pill-green">Anexado</span>
                          : <span className="pill pill-muted">Sem arquivo</span>}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="icon-btn" title="Visualizar"><Eye size={15} /></button>
                          <button className="icon-btn" title="Editar" onClick={() => setModal({ open: true, editing: d })}><Pencil size={15} /></button>
                          <button className="icon-btn icon-btn-danger" title="Excluir" onClick={() => deleteDespesa(d.id)}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Nenhuma despesa encontrada</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="table-pagination">
              <span className="pagination-info">
                Mostrando {Math.min((page - 1) * PER_PAGE + 1, filtered.length)} a {Math.min(page * PER_PAGE, filtered.length)} de {filtered.length} despesas
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>›</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modal.open && (
        <DespesaModal initial={modal.editing} onClose={closeModal} onSave={handleSave} />
      )}
    </div>
  );
}
