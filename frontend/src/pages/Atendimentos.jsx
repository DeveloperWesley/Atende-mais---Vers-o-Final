import {
  Banknote, CalendarDays, ChevronDown, CreditCard,
  Download, Pencil, Plus, QrCode, Search,
  SlidersHorizontal, Trash2, TrendingUp, Wallet, X
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import AtendimentoForm from '../components/AtendimentoForm.jsx';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useData } from '../contexts/DataContext.jsx';

const PER_PAGE = 5;
const fmt = (n) => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(n);
const FORMAS_PAG = ['PIX', 'Cartão', 'Dinheiro'];

const PAGTO_ICON = {
  'PIX':      <><QrCode size={13}/> PIX</>,
  'Cartão':   <><CreditCard size={13}/> Cartão</>,
  'Dinheiro': <><Banknote size={13}/> Dinheiro</>,
};

/* ── Helpers ── */
function isoToBR(iso) {
  if (!iso) return '';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function parseDateBR(str) {
  const [d,m,y] = (str||'').split('/');
  if (!d||!m||!y) return null;
  return new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T00:00:00`);
}
function formatDate(iso) { const [y,m,d]=iso.split('-'); return `${d}/${m}/${y}`; }
function formatCurrency(v) { return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v); }
function getFirstOfMonth(date) {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
}
function getLastOfMonth(date) {
  const d = date || new Date();
  return new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().slice(0,10);
}

/* Retorna o mês mais recente presente nos dados */
function getMostRecentMonth(items) {
  if (!items.length) return { start: getFirstOfMonth(), end: getLastOfMonth() };
  let maxDate = null;
  items.forEach(a => {
    const [d,m,y] = (a.data||'').split('/');
    if (d&&m&&y) {
      const dt = new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`);
      if (!maxDate || dt > maxDate) maxDate = dt;
    }
  });
  if (!maxDate) return { start: getFirstOfMonth(), end: getLastOfMonth() };
  return { start: getFirstOfMonth(maxDate), end: getLastOfMonth(maxDate) };
}

/* ── Componente de seleção de data (digitação + calendário) ── */
function DatePickerInput({ label, value, onChange }) {
  const calRef = useRef(null);
  const [text, setText] = useState(() => isoToBR(value));

  useEffect(() => { setText(isoToBR(value)); }, [value]);

  function handleText(e) {
    const raw    = e.target.value;
    const digits = raw.replace(/\D/g, '').slice(0, 8);
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

/* ── Avatar ── */
const PALETTE = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2','#9333ea','#16a34a'];
function avatarColor(nome='') {
  let h=0; for (let i=0;i<nome.length;i++) h=nome.charCodeAt(i)+((h<<5)-h);
  return PALETTE[Math.abs(h)%PALETTE.length];
}
function getInitials(nome='') {
  const p=nome.trim().split(' ').filter(Boolean);
  if(!p.length) return '?';
  if(p.length===1) return p[0].slice(0,2).toUpperCase();
  return (p[0][0]+p[p.length-1][0]).toUpperCase();
}

/* ════════════════════════════════════
   COMPONENTE PRINCIPAL
   ════════════════════════════════════ */
export default function Atendimentos() {
  const { atendimentos, addAtendimento, updateAtendimento, deleteAtendimento } = useData();

  /* Mês padrão = mês mais recente dos dados disponíveis */
  const defaultPeriod = getMostRecentMonth(atendimentos);

  const [search,      setSearch]      = useState('');
  const [filterPag,   setFilterPag]   = useState('');
  const [filterNF,    setFilterNF]    = useState('');
  const [periodStart, setPeriodStart] = useState(defaultPeriod.start);
  const [periodEnd,   setPeriodEnd]   = useState(defaultPeriod.end);
  const [page,        setPage]        = useState(1);
  const [modal,       setModal]       = useState({ open:false, editing:null });
  const [sortCol,     setSortCol]     = useState('data');
  const [sortDir,     setSortDir]     = useState('desc');

  const periodLabel = `${isoToBR(periodStart)} → ${isoToBR(periodEnd)}`;

  /* ── Filtragem por período + demais filtros ── */
  const filtered = useMemo(() => {
    const start = new Date(periodStart + 'T00:00:00');
    const end   = new Date(periodEnd   + 'T23:59:59');
    const q     = search.toLowerCase();
    return atendimentos.filter(a => {
      const dt  = parseDateBR(a.data);
      const nf  = 'precisaDoc' in a ? Boolean(a.precisaDoc) : a.receitaSaude !== 'nao';
      return (
        dt && dt >= start && dt <= end &&
        (!q         || a.paciente.toLowerCase().includes(q) || a.pagador?.toLowerCase().includes(q)) &&
        (!filterPag || a.formaPagamento === filterPag) &&
        (!filterNF  || (filterNF==='sim' ? nf : !nf))
      );
    });
  }, [atendimentos, search, filterPag, filterNF, periodStart, periodEnd]);

  /* ── Ordenação ── */
  const sorted = useMemo(() => [...filtered].sort((a,b) => {
    let va, vb;
    if      (sortCol==='data')     { va=parseDateBR(a.data)?.getTime()||0; vb=parseDateBR(b.data)?.getTime()||0; }
    else if (sortCol==='paciente') { va=a.paciente; vb=b.paciente; }
    else if (sortCol==='valor')    { va=a.valorNum||0; vb=b.valorNum||0; }
    else                           { va=0; vb=0; }
    if (typeof va==='string') return sortDir==='asc'?va.localeCompare(vb):vb.localeCompare(va);
    return sortDir==='asc'?va-vb:vb-va;
  }), [filtered, sortCol, sortDir]);

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const paginated  = sorted.slice((page-1)*PER_PAGE, page*PER_PAGE);

  function toggleSort(col) {
    if (sortCol===col) setSortDir(d=>d==='asc'?'desc':'asc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(1);
  }
  function SortArrow({ col }) {
    return <span style={{opacity:sortCol===col?1:0.3,fontSize:10}}> {sortCol===col?(sortDir==='asc'?'↑':'↓'):'↕'}</span>;
  }

  /* ── Métricas ── */
  const totalAtend  = filtered.length;
  const faturamento = filtered.reduce((s,a)=>s+(a.valorNum||0),0);
  const ticketMedio = totalAtend>0 ? faturamento/totalAtend : 0;

  /* ── Tags ativas ── */
  const activeTags = [
    filterPag && { key:'pag', label:`Pagamento: ${filterPag}`, clear:()=>{ setFilterPag(''); setPage(1); }},
    filterNF  && { key:'nf',  label:`NF: ${filterNF==='sim'?'Solicitou':'Não solicitou'}`, clear:()=>{ setFilterNF(''); setPage(1); }},
  ].filter(Boolean);

  function clearAll() {
    setSearch(''); setFilterPag(''); setFilterNF('');
    const p = getMostRecentMonth(atendimentos);
    setPeriodStart(p.start); setPeriodEnd(p.end);
    setPage(1);
  }

  /* ── Export CSV ── */
  function exportarCSV() {
    const header = 'Data;Paciente;Pagador;Valor (R$);Forma de Pagamento;Solicitou NF/Recibo';
    const rows   = sorted.map(a => {
      const nf  = 'precisaDoc' in a?(a.precisaDoc?'Sim':'Não'):(a.receitaSaude!=='nao'?'Sim':'Não');
      const val = (a.valorNum||0).toLocaleString('pt-BR',{minimumFractionDigits:2});
      return [a.data,a.paciente,a.pagador||'',val,a.formaPagamento||'',nf].join(';');
    });
    const blob=new Blob(['﻿'+[header,...rows].join('\n')],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);
    const el=document.createElement('a');
    el.href=url; el.download='atendimentos.csv'; el.click();
    URL.revokeObjectURL(url);
  }

  /* ── Modal ── */
  function closeModal() { setModal({open:false,editing:null}); }
  function handleSubmit(payload) {
    const num=parseFloat(String(payload.valorRecebido||'0').replace(',','.'))||0;
    const item={
      data:formatDate(payload.dataAtendimento),
      paciente:payload.pacienteNome, pagador:payload.pagadorNome,
      cpfPaciente:payload.pacienteCpf, cpfPagador:payload.pagadorDoc,
      valorNum:num, valor:formatCurrency(num),
      situacao:'concluido', recebimento:'recebido',
      servico:payload.servico||'Consulta',
      formaPagamento:payload.formaPagamento||'PIX',
      documentacao:payload.precisaDoc?'pendente':'completa',
      nfStatus:payload.precisaDoc?'pendente':'emitido',
      receitaSaude:'pronto', ...payload,
    };
    if (modal.editing) updateAtendimento(modal.editing.id,item);
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
            <button className="btn btn-primary btn-sm" onClick={()=>setModal({open:true,editing:null})}>
              <Plus size={15}/> Novo atendimento
            </button>
          }
        />

        <div className="main-content">

          {/* ── Barra de filtros ── */}
          <div className="at-filter-row">
            <span className="search-bar at-search-bar">
              <Search size={15}/>
              <input placeholder="Buscar paciente, CPF ou pagador..." value={search}
                onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
            </span>

            <DatePickerInput label="Data inicial" value={periodStart}
              onChange={e=>{setPeriodStart(e.target.value);setPage(1);}}/>

            <span className="at-date-arrow">→</span>

            <DatePickerInput label="Data final" value={periodEnd}
              onChange={e=>{setPeriodEnd(e.target.value);setPage(1);}}/>

            <div className="at-filter-group">
              <div className="desp-filter-select-wrap">
                <SlidersHorizontal size={13} className="desp-filter-icon"/>
                <select className="desp-filter-select" value={filterPag}
                  onChange={e=>{setFilterPag(e.target.value);setPage(1);}}>
                  <option value="">Forma de pagamento</option>
                  {FORMAS_PAG.map(f=><option key={f} value={f}>{f}</option>)}
                </select>
                <ChevronDown size={12} className="desp-filter-chevron"/>
              </div>

              <div className="desp-filter-select-wrap">
                <SlidersHorizontal size={13} className="desp-filter-icon" style={{opacity:0}}/>
                <select className="desp-filter-select" value={filterNF}
                  onChange={e=>{setFilterNF(e.target.value);setPage(1);}}>
                  <option value="">NF / Recibo</option>
                  <option value="sim">Solicitou</option>
                  <option value="nao">Não solicitou</option>
                </select>
                <ChevronDown size={12} className="desp-filter-chevron"/>
              </div>

              <button className="btn btn-ghost btn-sm" onClick={exportarCSV}>
                <Download size={14}/> Exportar
              </button>
            </div>
          </div>

          {/* ── Tags ativas ── */}
          {(activeTags.length>0||search) && (
            <div className="desp-active-tags" style={{marginBottom:12}}>
              {activeTags.map(tag=>(
                <span key={tag.key} className="desp-tag">
                  {tag.label}
                  <button type="button" onClick={tag.clear}><X size={12}/></button>
                </span>
              ))}
              <button className="desp-clear-btn" onClick={clearAll}>
                <Trash2 size={13}/> Limpar filtros
              </button>
            </div>
          )}

          {/* ── Tabela ── */}
          <div className="surface-card at-table-card">
            <div className="table-wrap">
              <table className="atendimento-table">
                <thead>
                  <tr>
                    <th onClick={()=>toggleSort('paciente')} style={{cursor:'pointer'}}>Paciente <SortArrow col="paciente"/></th>
                    <th onClick={()=>toggleSort('data')}     style={{cursor:'pointer'}}>Data <SortArrow col="data"/></th>
                    <th>Pagador</th>
                    <th onClick={()=>toggleSort('valor')}    style={{cursor:'pointer'}}>Valor <SortArrow col="valor"/></th>
                    <th>Forma pagamento</th>
                    <th>NF / Recibo</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(a=>{
                    const pagto    = a.formaPagamento||'PIX';
                    const pagtoKey = pagto==='Cartão'?'cartao':pagto.toLowerCase();
                    const nf       = 'precisaDoc' in a?Boolean(a.precisaDoc):a.receitaSaude!=='nao';
                    return (
                      <tr key={a.id}>
                        <td className="td-main">
                          <div className="at-patient-cell">
                            <span className="at-avatar" style={{background:avatarColor(a.paciente)}}>
                              {getInitials(a.paciente)}
                            </span>
                            {a.paciente}
                          </div>
                        </td>
                        <td data-label="Data" className="table-cell-muted">{a.data}</td>
                        <td data-label="Pagador" className="table-cell-muted">{a.pagador}</td>
                        <td data-label="Valor"><strong>{a.valor}</strong></td>
                        <td data-label="Pagamento">
                          <span className={`pagto-chip pagto-${pagtoKey}`}>{PAGTO_ICON[pagto]||pagto}</span>
                        </td>
                        <td data-label="NF / Recibo">
                          <span className={nf?'pill pill-blue':'pill pill-muted'}>{nf?'Sim':'Não'}</span>
                        </td>
                        <td className="td-actions">
                          <div className="table-actions">
                            <button className="icon-btn" title="Editar" onClick={()=>setModal({open:true,editing:a})}>
                              <Pencil size={15}/>
                            </button>
                            <button className="icon-btn icon-btn-danger" title="Excluir" onClick={()=>deleteAtendimento(a.id)}>
                              <Trash2 size={15}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paginated.length===0 && (
                    <tr><td colSpan={7} style={{textAlign:'center',padding:'32px',color:'var(--text-muted)'}}>
                      Nenhum atendimento encontrado no período selecionado
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-pagination">
              <span className="pagination-info">
                Mostrando {sorted.length===0?0:Math.min((page-1)*PER_PAGE+1,sorted.length)} a {Math.min(page*PER_PAGE,sorted.length)} de {sorted.length} atendimentos
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page===1} onClick={()=>setPage(page-1)}>‹</button>
                {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                  <button key={p} className={`page-btn${p===page?' active':''}`} onClick={()=>setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={page===totalPages||totalPages===0} onClick={()=>setPage(page+1)}>›</button>
              </div>
            </div>
          </div>

          {/* ── Métricas ── */}
          <div className="surface-card at-metrics-bar">
            <div className="at-metric">
              <div className="at-metric-icon" style={{background:'linear-gradient(135deg,#6c5ce7,#a855f7)'}}>
                <CalendarDays size={22} color="#fff"/>
              </div>
              <div className="at-metric-info">
                <strong>{totalAtend}</strong>
                <span>Total de atendimentos</span>
                <small className="at-metric-period">{periodLabel}</small>
              </div>
            </div>

            <div className="at-metric-divider"/>

            <div className="at-metric">
              <div className="at-metric-icon" style={{background:'linear-gradient(135deg,#2563eb,#6366f1)'}}>
                <Wallet size={22} color="#fff"/>
              </div>
              <div className="at-metric-info">
                <strong>{fmt(faturamento)}</strong>
                <span>Faturamento total</span>
                <small className="at-metric-period">{periodLabel}</small>
              </div>
            </div>

            <div className="at-metric-divider"/>

            <div className="at-metric">
              <div className="at-metric-icon" style={{background:'linear-gradient(135deg,#f97316,#ef4444)'}}>
                <TrendingUp size={22} color="#fff"/>
              </div>
              <div className="at-metric-info">
                <strong>{fmt(ticketMedio)}</strong>
                <span>Ticket médio</span>
                <small className="at-metric-period">{periodLabel}</small>
              </div>
            </div>
          </div>

        </div>
      </div>

      {modal.open && (
        <div className="modal-backdrop">
          <section className="modal-panel surface-card">
            <div className="modal-heading">
              <h2>{modal.editing?'Editar atendimento':'Novo atendimento'}</h2>
              <p>Registre os dados necessários para controle fiscal e financeiro.</p>
            </div>
            <AtendimentoForm initialValues={modal.editing} onCancel={closeModal} onSubmit={handleSubmit}/>
          </section>
        </div>
      )}
    </div>
  );
}
