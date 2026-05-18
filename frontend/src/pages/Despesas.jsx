import { useEffect, useMemo, useRef, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Banknote, BarChart2, CalendarDays, ChevronDown, CreditCard, Download, ExternalLink, FileText, Paperclip, Pencil, Plus, QrCode, Search, SlidersHorizontal, Trash2, TrendingDown, TrendingUp, Wallet, X } from 'lucide-react';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useData } from '../contexts/DataContext.jsx';

const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
const PER_PAGE = 5;

const TABS_CATS = ['Todas', 'Aluguel', 'Energia', 'Água', 'Internet', 'Telefone', 'Software / Sistema', 'Assinaturas', 'Conselho profissional', 'Contador', 'Secretária', 'Marketing', 'Combustível', 'Transporte', 'Materiais', 'Equipamentos', 'Manutenção', 'Impostos', 'Taxas', 'Cursos', 'Limpeza', 'Alimentação', 'Outros'];
const CATEGORIAS_FORM = ['Aluguel', 'Energia', 'Água', 'Internet', 'Telefone', 'Software / Sistema', 'Assinaturas', 'Conselho profissional', 'Contador', 'Secretária', 'Marketing', 'Combustível', 'Transporte', 'Materiais', 'Equipamentos', 'Manutenção', 'Impostos', 'Taxas', 'Cursos', 'Limpeza', 'Alimentação', 'Outros'];
const FORMAS_PAG = ['Pix', 'Débito', 'Crédito', 'Dinheiro', 'Transferência'];

const CAT_COLORS = {
  'Aluguel':               '#6366f1',
  'Energia':               '#f59e0b',
  'Água':                  '#06b6d4',
  'Internet':              '#3b82f6',
  'Telefone':              '#8b5cf6',
  'Software / Sistema':    '#ec4899',
  'Assinaturas':           '#a855f7',
  'Conselho profissional': '#14b8a6',
  'Contador':              '#0ea5e9',
  'Secretária':            '#f472b6',
  'Marketing':             '#22c55e',
  'Combustível':           '#f97316',
  'Transporte':            '#fb923c',
  'Materiais':             '#eab308',
  'Equipamentos':          '#84cc16',
  'Manutenção':            '#10b981',
  'Impostos':              '#ef4444',
  'Taxas':                 '#dc2626',
  'Cursos':                '#6366f1',
  'Limpeza':               '#67e8f9',
  'Alimentação':           '#fdba74',
  'Outros':                '#94a3b8',
};

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTH_NAMES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function parseBR(s) {
  const [d, m, y] = (s || '').split('/');
  if (!d || !m || !y) return null;
  return new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`);
}

function catNorm(cat) {
  return CATEGORIAS_FORM.includes(cat) ? cat : 'Outros';
}

function pagtoChip(forma) {
  const map = {
    'Pix':          { cls: 'pagto-chip pagto-pix',      icon: <QrCode size={12} />,      label: 'Pix'       },
    'Débito':       { cls: 'pagto-chip pagto-debito',   icon: <CreditCard size={12} />,  label: 'Débito'    },
    'Crédito':      { cls: 'pagto-chip pagto-credito',  icon: <CreditCard size={12} />,  label: 'Crédito'   },
    'Dinheiro':     { cls: 'pagto-chip pagto-dinheiro', icon: <Banknote size={12} />,    label: 'Dinheiro'  },
    'Transferência':{ cls: 'pagto-chip pagto-cartao',   icon: <Wallet size={12} />,      label: 'Transf.'   },
  };
  const item = map[forma] || { cls: 'pagto-chip pagto-pix', icon: null, label: forma };
  return <span className={item.cls}>{item.icon} {item.label}</span>;
}

/* ── Upload de comprovante (múltiplos arquivos) ── */
function FileUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  /* Normaliza para sempre trabalhar com array */
  const files = Array.isArray(value) ? value : (value === true ? [{ _legacy: true }] : []);

  function formatSize(bytes) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const MAX_FILES = 5;

  function addFiles(newFiles) {
    const current = files.filter((f) => !f._legacy);
    const remaining = MAX_FILES - current.length;
    if (remaining <= 0) { alert(`Limite de ${MAX_FILES} arquivos atingido.`); return; }
    const valid = Array.from(newFiles).slice(0, remaining).filter((f) => {
      if (f.size > 10 * 1024 * 1024) { alert(`"${f.name}" é muito grande. Máximo: 10MB.`); return false; }
      return true;
    });
    if (!valid.length) return;
    if (Array.from(newFiles).length > remaining) alert(`Apenas ${remaining} arquivo(s) adicionado(s). Limite: ${MAX_FILES}.`);
    onChange([...current, ...valid]);
  }

  function removeFile(idx) {
    const next = files.filter((_, i) => i !== idx);
    onChange(next.length ? next : null);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  const CloudUploadIcon = () => (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="44" height="44">
      <path d="M24 32V16M24 16L17 23M24 16L31 23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 32C8 38 12 42 18 42H30C36 42 40 38 40 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M8 28C5.5 26 4 22.5 4 19C4 13 9 8 16 8C17.5 8 19 8.5 20 9C21.5 6 24.5 4 28 4C33.5 4 38 8.5 38 14C38 14.7 37.9 15.3 37.8 16C41.4 17 44 20.2 44 24C44 28.4 40.4 32 36 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div className="file-upload-wrap">
      {/* Lista de arquivos já anexados */}
      {files.length > 0 && (
        <div className="file-list">
          {files.map((f, idx) => {
            const isLegacy = f._legacy;
            const url = (!isLegacy && f instanceof File) ? URL.createObjectURL(f) : null;
            return (
              <div key={idx} className="file-attached">
                <div className="file-attached-icon-wrap">
                  <FileText size={18} />
                </div>
                <div className="file-attached-info">
                  <span className="file-attached-name">{isLegacy ? 'comprovante.pdf' : f.name}</span>
                  <span className="file-attached-size">{isLegacy ? 'Arquivo anterior' : formatSize(f.size)}</span>
                </div>
                <div className="file-attached-actions">
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="file-action-btn" title="Abrir">
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button type="button" className="file-action-btn file-action-remove" title="Remover" onClick={() => removeFile(idx)}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dropzone — sempre visível para adicionar mais */}
      <div
        className={`file-dropzone${dragging ? ' file-dropzone-dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        />
        <div className="file-dropzone-icon"><CloudUploadIcon /></div>
        <p className="file-dropzone-title">Arraste o comprovante aqui</p>
        <p className="file-dropzone-sub">ou <span className="file-dropzone-link">clique para selecionar</span></p>
        <p className="file-dropzone-hint">Formatos aceitos: PDF, JPG ou PNG (máx. 10MB)</p>
      </div>
    </div>
  );
}

/* ── Modal de despesa ── */
function DespesaModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || {
    data: '', descricao: '', categoria: 'Aluguel',
    valorNum: '', formaPagamento: 'Pix', comprovante: null,
  });
  const [errors, setErrors] = useState({});

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  }

  function validate() {
    const errs = {};
    if (!form.data)                                        errs.data      = 'Informe a data.';
    if (!form.descricao.trim())                            errs.descricao = 'Informe a descrição.';
    if (!form.valorNum || parseFloat(String(form.valorNum).replace(',','.')) <= 0) errs.valorNum = 'Informe um valor.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave(e) {
    e.preventDefault();
    if (!validate()) return;
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
              <span className="field-label">Data *</span>
              <span className={`input-shell${errors.data ? ' input-error' : ''}`}>
                <input type="date" value={form.data} onChange={set('data')} />
              </span>
              {errors.data && <span className="field-error">{errors.data}</span>}
            </label>
            <label className="field">
              <span className="field-label">Categoria</span>
              <span className="input-shell">
                <select value={form.categoria} onChange={set('categoria')}>
                  {CATEGORIAS_FORM.map((c) => <option key={c}>{c}</option>)}
                </select>
              </span>
            </label>
            <label className="field field-full">
              <span className="field-label">Descrição *</span>
              <span className={`input-shell${errors.descricao ? ' input-error' : ''}`}>
                <input type="text" placeholder="Ex: Aluguel sala comercial" value={form.descricao} onChange={set('descricao')} />
              </span>
              {errors.descricao && <span className="field-error">{errors.descricao}</span>}
            </label>
            <label className="field">
              <span className="field-label">Valor (R$) *</span>
              <span className={`input-shell${errors.valorNum ? ' input-error' : ''}`}>
                <input type="text" placeholder="0,00" value={form.valorNum} onChange={set('valorNum')} />
              </span>
              {errors.valorNum && <span className="field-error">{errors.valorNum}</span>}
            </label>
            <label className="field">
              <span className="field-label">Forma de pagamento</span>
              <span className="input-shell">
                <select value={form.formaPagamento} onChange={set('formaPagamento')}>
                  {FORMAS_PAG.map((f) => <option key={f}>{f}</option>)}
                </select>
              </span>
            </label>
            <div className="field field-full">
              <span className="field-label">Comprovante <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opcional)</span></span>
              <FileUpload
                value={form.comprovante}
                onChange={(file) => setForm((f) => ({ ...f, comprovante: file }))}
              />
            </div>
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

/* ── Date helpers ── */
function isoToBR(iso) {
  if (!iso) return '';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function getFirstOfMonth(date) {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
}
function getLastOfMonth(date) {
  const d = date || new Date();
  return new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().slice(0,10);
}
function getMostRecentMonthDesp(items) {
  if (!items.length) return { start: getFirstOfMonth(), end: getLastOfMonth() };
  let maxDate = null;
  items.forEach(d => {
    const [dd,mm,yy] = (d.data||'').split('/');
    if (dd&&mm&&yy) {
      const dt = new Date(`${yy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`);
      if (!maxDate || dt > maxDate) maxDate = dt;
    }
  });
  if (!maxDate) return { start: getFirstOfMonth(), end: getLastOfMonth() };
  return { start: getFirstOfMonth(maxDate), end: getLastOfMonth(maxDate) };
}

/* ── DatePickerInput (digitação + calendário) ── */
function DatePickerInput({ label, value, onChange }) {
  const calRef = useRef(null);
  const [text, setText] = useState(() => isoToBR(value));

  useEffect(() => { setText(isoToBR(value)); }, [value]);

  function handleText(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    let masked   = digits;
    if (digits.length > 2) masked = digits.slice(0,2) + '/' + digits.slice(2);
    if (digits.length > 4) masked = digits.slice(0,2) + '/' + digits.slice(2,4) + '/' + digits.slice(4);
    setText(masked);
    if (digits.length === 8) {
      const iso = `${digits.slice(4,8)}-${digits.slice(2,4)}-${digits.slice(0,2)}`;
      if (!isNaN(new Date(iso + 'T00:00:00').getTime())) onChange({ target: { value: iso } });
    }
  }

  function openCal(e) {
    e.preventDefault();
    try { calRef.current?.showPicker?.(); } catch { calRef.current?.focus(); }
  }

  function handleCalChange(e) {
    onChange(e);
    setText(isoToBR(e.target.value));
  }

  return (
    <div className="at-datepick-wrap">
      <span className="at-date-label">{label}</span>
      <div className="at-datepick-display">
        <input type="text" className="at-datepick-text"
          value={text} onChange={handleText}
          placeholder="DD/MM/AAAA" maxLength={10} />
        <button type="button" className="at-datepick-cal-btn" onClick={openCal} tabIndex={-1}>
          <CalendarDays size={15} />
        </button>
        <input ref={calRef} type="date" value={value}
          onChange={handleCalChange} className="at-datepick-hidden" tabIndex={-1} />
      </div>
    </div>
  );
}

/* ── Página principal ── */
export default function Despesas() {
  const { despesas, addDespesa, updateDespesa, deleteDespesa } = useData();
  const defaultPeriod = getMostRecentMonthDesp(despesas);

  const [search,      setSearch]      = useState('');
  const [filterCat,   setFilterCat]   = useState('');
  const [filterPag,   setFilterPag]   = useState('');
  const [periodStart, setPeriodStart] = useState(defaultPeriod.start);
  const [periodEnd,   setPeriodEnd]   = useState(defaultPeriod.end);
  const [page,        setPage]        = useState(1);
  const [modal,       setModal]       = useState({ open: false, editing: null });
  const [sortCol,     setSortCol]     = useState('data');
  const [sortDir,     setSortDir]     = useState('desc');

  const periodLabel = `${isoToBR(periodStart)} → ${isoToBR(periodEnd)}`;

  // ── Filtragem com todos os filtros + período
  const filtered = useMemo(() => {
    const start = new Date(periodStart + 'T00:00:00');
    const end   = new Date(periodEnd   + 'T23:59:59');
    const q     = search.toLowerCase();
    return despesas.filter(d => {
      const [dd,mm,yy] = (d.data||'').split('/');
      const dt = (dd&&mm&&yy) ? new Date(`${yy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}T00:00:00`) : null;
      return (
        dt && dt >= start && dt <= end &&
        (!q         || d.descricao.toLowerCase().includes(q) || d.categoria.toLowerCase().includes(q)) &&
        (!filterCat || catNorm(d.categoria) === filterCat) &&
        (!filterPag || d.formaPagamento === filterPag)
      );
    });
  }, [despesas, search, filterCat, filterPag, periodStart, periodEnd]);

  // ── Ordenação
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let va, vb;
    if (sortCol === 'data')       { va = parseBR(a.data)?.getTime() || 0; vb = parseBR(b.data)?.getTime() || 0; }
    else if (sortCol === 'valor') { va = a.valorNum; vb = b.valorNum; }
    else if (sortCol === 'desc')  { va = a.descricao; vb = b.descricao; }
    else if (sortCol === 'cat')   { va = a.categoria; vb = b.categoria; }
    else                          { va = 0; vb = 0; }
    if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === 'asc' ? va - vb : vb - va;
  }), [filtered, sortCol, sortDir]);

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const paginated  = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(1);
  }
  function SortArrow({ col }) {
    if (sortCol !== col) return <span style={{ opacity: 0.3, fontSize: 10 }}> ↕</span>;
    return <span style={{ fontSize: 10 }}> {sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  // ── Totais do período filtrado
  const totalPeriodo = filtered.reduce((s, d) => s + d.valorNum, 0);
  const uniqueMonths = useMemo(() => {
    const s = new Set();
    despesas.forEach(d => { const p = d.data.split('/'); if (p.length >= 3) s.add(`${p[2]}-${p[1]}`); });
    return s.size || 1;
  }, [despesas]);
  const mediaMensal = despesas.reduce((s,d)=>s+d.valorNum,0) / uniqueMonths;

  // Trend: mês do período vs mês anterior
  const [pyy, pmm] = periodStart.split('-').map(Number);
  const prevMonthKey = pmm === 1 ? `${pyy-1}-12` : `${pyy}-${String(pmm-1).padStart(2,'0')}`;
  const totalPrevM = despesas.filter(d => { const p = d.data.split('/'); return p.length>=3&&`${p[2]}-${p[1]}`===prevMonthKey; }).reduce((s,d)=>s+d.valorNum,0);
  const trendPct   = totalPrevM > 0 ? ((totalPeriodo - totalPrevM) / totalPrevM * 100) : null;
  const trendUp    = trendPct !== null && trendPct >= 0;
  const prevLabel  = prevMonthKey ? `${MONTH_NAMES[(pmm===1?12:pmm-1)-1]}/${pmm===1?pyy-1:pyy}` : '';

  // ── Donut Top 5 + Outros (dados do período filtrado)
  const catTotals = {};
  filtered.forEach(d => { const c = catNorm(d.categoria); catTotals[c] = (catTotals[c] || 0) + d.valorNum; });
  const top5cats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const outrosVal = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(5).reduce((s, [, v]) => s + v, 0);
  const donutData = [
    ...top5cats.map(([name, value]) => ({ name, value, color: CAT_COLORS[name] || '#94a3b8' })),
    ...(outrosVal > 0 ? [{ name: 'Outros', value: outrosVal, color: '#94a3b8' }] : []),
  ];

  // ── Tags de filtros ativos
  const activeTags = [
    filterCat && { key:'cat', label:`Categoria: ${filterCat}`, clear:()=>{ setFilterCat(''); setPage(1); }},
    filterPag && { key:'pag', label:`Pagamento: ${filterPag}`, clear:()=>{ setFilterPag(''); setPage(1); }},
  ].filter(Boolean);

  function clearAllFilters() {
    setFilterCat(''); setFilterPag(''); setSearch('');
    const p = getMostRecentMonthDesp(despesas);
    setPeriodStart(p.start); setPeriodEnd(p.end);
    setPage(1);
  }

  // ── Export CSV
  function exportarCSV() {
    const header = 'Data;Descrição;Categoria;Valor;Forma de Pagamento;Comprovante';
    const rows   = sorted.map(d => [d.data, d.descricao, d.categoria, d.valorNum.toFixed(2), d.formaPagamento, d.comprovante ? 'Sim' : 'Não'].join(';'));
    const csv    = [header, ...rows].join('\n');
    const blob   = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href = url; a.download = 'despesas.csv'; a.click();
    URL.revokeObjectURL(url);
  }

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
          subtitle="Gerencie e acompanhe todas as despesas do consultório."
          actions={
            <button className="btn btn-primary btn-sm" onClick={() => setModal({ open: true, editing: null })}>
              <Plus size={15} /> Nova despesa
            </button>
          }
        />

        <div className="main-content">

          {/* ── Barra de filtros flutuante (mesmo padrão de Atendimentos) ── */}
          <div className="at-filter-row">
            <span className="search-bar at-search-bar">
              <Search size={15} />
              <input placeholder="Buscar descrição ou categoria..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </span>

            <div className="at-filter-group">
              <div className="desp-filter-select-wrap">
                <SlidersHorizontal size={13} className="desp-filter-icon" />
                <select className="desp-filter-select" value={filterCat}
                  onChange={e => { setFilterCat(e.target.value); setPage(1); }}>
                  <option value="">Categoria</option>
                  {CATEGORIAS_FORM.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={12} className="desp-filter-chevron" />
              </div>

              <div className="desp-filter-select-wrap">
                <Wallet size={13} className="desp-filter-icon" />
                <select className="desp-filter-select" value={filterPag}
                  onChange={e => { setFilterPag(e.target.value); setPage(1); }}>
                  <option value="">Forma de pagamento</option>
                  {FORMAS_PAG.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <ChevronDown size={12} className="desp-filter-chevron" />
              </div>
            </div>

            <DatePickerInput label="Data inicial" value={periodStart}
              onChange={e => { setPeriodStart(e.target.value); setPage(1); }} />

            <span className="at-date-arrow">→</span>

            <DatePickerInput label="Data final" value={periodEnd}
              onChange={e => { setPeriodEnd(e.target.value); setPage(1); }} />

            <button className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-end' }} onClick={exportarCSV}>
              <Download size={14} /> Exportar
            </button>
          </div>

          {/* Tags de filtros ativos */}
          {(activeTags.length > 0 || search) && (
            <div className="desp-active-tags" style={{ marginBottom: 12 }}>
              {activeTags.map(tag => (
                <span key={tag.key} className="desp-tag">
                  {tag.label}
                  <button type="button" onClick={tag.clear}><X size={12} /></button>
                </span>
              ))}
              <button className="desp-clear-btn" onClick={clearAllFilters}>
                <Trash2 size={13} /> Limpar filtros
              </button>
            </div>
          )}

          {/* ── Tabela (mesmo padrão at-table-card) ── */}
          <div className="surface-card at-table-card">
            <div className="table-wrap">
              <table className="atendimento-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('data')} style={{ cursor: 'pointer' }}>Data <SortArrow col="data" /></th>
                    <th onClick={() => toggleSort('desc')} style={{ cursor: 'pointer' }}>Descrição <SortArrow col="desc" /></th>
                    <th onClick={() => toggleSort('cat')}  style={{ cursor: 'pointer' }}>Categoria <SortArrow col="cat" /></th>
                    <th onClick={() => toggleSort('valor')} style={{ cursor: 'pointer' }}>Valor <SortArrow col="valor" /></th>
                    <th>Forma de pagamento</th>
                    <th>Comprovante</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((d) => (
                    <tr key={d.id}>
                      <td className="td-main">{d.descricao}</td>
                      <td data-label="Data" className="table-cell-muted">{d.data}</td>
                      <td data-label="Categoria">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: CAT_COLORS[d.categoria] || '#94a3b8' }} />
                          {d.categoria}
                        </span>
                      </td>
                      <td data-label="Valor"><strong>{d.valor}</strong></td>
                      <td data-label="Pagamento">{pagtoChip(d.formaPagamento)}</td>
                      <td data-label="Comprovante">
                        {Array.isArray(d.comprovante) && d.comprovante.length > 0 ? (
                          <span className="pill pill-green" style={{ gap: 5 }}>
                            <Download size={11} /> {d.comprovante.length} arquivo{d.comprovante.length > 1 ? 's' : ''}
                          </span>
                        ) : d.comprovante === true ? (
                          <span className="pill pill-green">Anexado</span>
                        ) : (
                          <span className="pill pill-muted">Sem arquivo</span>
                        )}
                      </td>
                      <td className="td-actions">
                        <div className="table-actions">
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
                Mostrando {sorted.length === 0 ? 0 : Math.min((page - 1) * PER_PAGE + 1, sorted.length)} a {Math.min(page * PER_PAGE, sorted.length)} de {sorted.length} despesas
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

          {/* ── 2 cards inferiores ── */}
          <div className="desp-bottom-row">

            {/* Card 1: Resumo financeiro */}
            <div className="surface-card at-metrics-bar">
              <div className="at-metric">
                <div className="at-metric-icon" style={{ background:'linear-gradient(135deg,#2563eb,#6366f1)' }}>
                  <Wallet size={22} color="#fff" />
                </div>
                <div className="at-metric-info">
                  <strong>{fmt(totalPeriodo)}</strong>
                  <span>Total em despesas</span>
                  <small className="at-metric-period">{periodLabel}</small>
                </div>
              </div>

              <div className="at-metric-divider" />

              <div className="at-metric">
                <div className="at-metric-icon" style={{ background:'linear-gradient(135deg,#059669,#10b981)' }}>
                  <BarChart2 size={22} color="#fff" />
                </div>
                <div className="at-metric-info">
                  <strong>{fmt(mediaMensal)}</strong>
                  <span>Média mensal</span>
                  <small style={{ color:'var(--text-light)' }}>Últimos {uniqueMonths} meses</small>
                </div>
              </div>
            </div>

            {/* Card 2: Top 5 categorias */}
            <div className="surface-card desp-donut-card">
              <h3 className="desp-card-title">Categorias de despesas (Top 5)</h3>
              <div className="donut-layout" style={{ marginTop: 16 }}>
                <div className="donut-chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={52} outerRadius={76}
                        paddingAngle={2} dataKey="value" isAnimationActive={false}>
                        {donutData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip
                        formatter={(v) => [fmt(v), '']}
                        contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center">
                    <span>Total</span>
                    <strong>{fmt(totalPeriodo)}</strong>
                  </div>
                </div>
                <div className="donut-legend">
                  {donutData.map(cat => (
                    <div key={cat.name} className="donut-legend-row">
                      <span className="donut-dot" style={{ background: cat.color }} />
                      <span className="donut-cat-name">{cat.name}</span>
                      <span className="donut-cat-val">{fmt(cat.value)}</span>
                    </div>
                  ))}
                  {donutData.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Sem despesas</p>}
                </div>
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
