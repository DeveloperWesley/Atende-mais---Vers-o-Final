import {
  BarChart2, BookOpen, CalendarDays, Check, ChevronDown,
  Download, FileSpreadsheet, FileText, MoreVertical,
  Plus, Receipt, TrendingUp
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useData } from '../contexts/DataContext.jsx';

/* ── Helpers ── */
const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

function parseDateISO(iso) {
  if (!iso) return null;
  return new Date(iso + 'T00:00:00');
}
function parseDateBR(str) {
  const [d, m, y] = (str || '').split('/');
  if (!d || !m || !y) return null;
  return new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T00:00:00`);
}
function isoToBR(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function nowLabel() {
  return new Date().toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }).replace(',', ' às');
}

/* ── Dados estáticos ── */
const REPORT_CARDS = [
  {
    key: 'resumo',
    label: 'Resumo financeiro',
    desc: 'Resumo de receitas, despesas e lucro líquido no período selecionado.',
    color: '#7c3aed', bg: 'rgba(124,58,237,0.14)',
    Icon: TrendingUp,
    items: ['Receitas totais','Despesas totais','Lucro líquido','Quantidade de atendimentos','Ticket médio'],
  },
  {
    key: 'atendimentos',
    label: 'Atendimentos recebidos',
    desc: 'Lista detalhada de todos os atendimentos já recebidos.',
    color: '#2563eb', bg: 'rgba(37,99,235,0.14)',
    Icon: CalendarDays,
    items: ['Atendimentos recebidos','Pacientes e pagadores','Valores recebidos','Forma de pagamento','NF/Recibo emitido'],
  },
  {
    key: 'despesas',
    label: 'Despesas',
    desc: 'Lista detalhada de todas as despesas cadastradas.',
    color: '#059669', bg: 'rgba(5,150,105,0.14)',
    Icon: Receipt,
    items: ['Todas as despesas','Categoria','Forma de pagamento','Comprovante','Total por categoria'],
  },
  {
    key: 'contador',
    label: 'Relatório para contador',
    desc: 'Relatório completo com todas as informações para seu contador.',
    color: '#d97706', bg: 'rgba(217,119,6,0.14)',
    Icon: BookOpen,
    items: ['Todos os atendimentos','Paciente solicitou NF/Recibo?','Todas as despesas','Despesas por categoria'],
  },
];

const TYPE_LABELS = {
  resumo: 'Resumo financeiro',
  atendimentos: 'Atendimentos recebidos',
  despesas: 'Despesas',
  contador: 'Para contador',
};
const TYPE_COLORS = {
  resumo: '#7c3aed', atendimentos: '#2563eb', despesas: '#059669', contador: '#d97706',
};

const INITIAL_REPORTS = [
  { id: 1, nome: 'Resumo Financeiro - Maio/2024',       tipo: 'resumo',       periodo: '01/05/2024 - 31/05/2024', geradoEm: '16/05/2024 às 14:30', formato: 'PDF' },
  { id: 2, nome: 'Atendimentos Recebidos - Maio/2024',  tipo: 'atendimentos', periodo: '01/05/2024 - 31/05/2024', geradoEm: '16/05/2024 às 14:25', formato: 'CSV' },
  { id: 3, nome: 'Despesas - Maio/2024',                tipo: 'despesas',     periodo: '01/05/2024 - 31/05/2024', geradoEm: '16/05/2024 às 14:20', formato: 'PDF' },
  { id: 4, nome: 'Relatório para Contador - Maio/2024', tipo: 'contador',     periodo: '01/05/2024 - 31/05/2024', geradoEm: '16/05/2024 às 14:15', formato: 'PDF' },
];

const PER_PAGE = 5;

/* ── PDF HTML templates ── */
const PDF_BASE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1f2937;font-size:12.5px;line-height:1.55;background:#fff}

/* ── Header ── */
.pdf-header{
  background:linear-gradient(135deg,#0f172a 0%,#1e0a35 55%,#0c1a30 100%);
  padding:28px 36px;display:flex;justify-content:space-between;align-items:center;
  -webkit-print-color-adjust:exact;print-color-adjust:exact
}
.pdf-logo-wrap{display:flex;align-items:center;gap:13px}
.pdf-logo-text{font-size:21px;font-weight:800;color:#fff;letter-spacing:-0.03em;line-height:1}
.pdf-logo-plus{color:#a78bfa}
.pdf-logo-sub{font-size:10.5px;color:rgba(255,255,255,0.45);margin-top:4px}
.pdf-meta{text-align:right}
.pdf-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.09em;color:#a78bfa;margin-bottom:5px}
.pdf-meta-title{font-size:15px;font-weight:700;color:#fff;margin-bottom:5px}
.pdf-meta-info{font-size:11px;color:rgba(255,255,255,0.55);line-height:1.7}

/* ── Accent bar ── */
.pdf-accent{height:4px;background:linear-gradient(90deg,#7c3aed,#2563eb,#059669);-webkit-print-color-adjust:exact;print-color-adjust:exact}

/* ── Body ── */
.pdf-body{padding:28px 36px}

h2{font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.08em;
   margin:26px 0 12px;padding-bottom:7px;border-bottom:2px solid #ede9fe}
h2:first-child{margin-top:0}

/* ── KPI cards ── */
.kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:26px}
.kpi{padding:14px 16px;border-radius:8px;background:#faf8ff;border-left:3px solid #7c3aed;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.kpi.green{border-left-color:#059669;background:#f0fdf4}
.kpi.red  {border-left-color:#dc2626;background:#fef2f2}
.kpi.blue {border-left-color:#2563eb;background:#eff6ff}
.kpi label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;display:block;margin-bottom:5px}
.kpi strong{font-size:17px;font-weight:800;color:#111827;display:block}

/* ── Tabelas ── */
table{width:100%;border-collapse:collapse;margin-bottom:22px;border-radius:8px;overflow:hidden}
thead tr{background:#7c3aed;-webkit-print-color-adjust:exact;print-color-adjust:exact}
th{padding:10px 13px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#fff}
tbody tr:nth-child(even){background:#faf8ff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
td{padding:9px 13px;border-bottom:1px solid #f0edfb;font-size:12px;color:#374151}
tbody tr:last-child td{border-bottom:none}
td strong{font-weight:700;color:#111827}
.sim{color:#059669;font-weight:700}
.nao{color:#9ca3af;font-weight:600}

/* ── Footer ── */
.pdf-footer{
  display:flex;justify-content:space-between;align-items:center;
  padding:14px 36px;border-top:1px solid #e5e7eb;
  background:#f9fafb;margin-top:24px;
  -webkit-print-color-adjust:exact;print-color-adjust:exact
}
.pdf-footer-logo{font-size:13px;font-weight:800;color:#374151}
.pdf-footer-logo span{color:#7c3aed}
.pdf-footer-txt{font-size:10.5px;color:#9ca3af}

@media print{@page{margin:0}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
`;

const PDF_LOGO_SVG = `<svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="plg" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#52D4FF"/>
      <stop offset="42%" stop-color="#5058FF"/>
      <stop offset="100%" stop-color="#7B12FF"/>
    </linearGradient>
    <linearGradient id="psg" x1="50" y1="10" x2="50" y2="56" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="plc">
      <rect x="38" y="10" width="24" height="80" rx="12"/>
      <rect x="10" y="38" width="80" height="24" rx="12"/>
    </clipPath>
  </defs>
  <g clip-path="url(#plc)">
    <rect x="0" y="0" width="100" height="100" fill="url(#plg)"/>
    <rect x="0" y="0" width="100" height="100" fill="url(#psg)"/>
  </g>
</svg>`;

function buildPDFWindow(title, period, bodyContent) {
  const now = nowLabel();
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>${title} — Atende+</title>
  <style>${PDF_BASE_CSS}</style></head><body>
  <div class="pdf-header">
    <div class="pdf-logo-wrap">
      ${PDF_LOGO_SVG}
      <div>
        <div class="pdf-logo-text">Atende<span class="pdf-logo-plus">+</span></div>
        <div class="pdf-logo-sub">Sistema de gestão para saúde</div>
      </div>
    </div>
    <div class="pdf-meta">
      <div class="pdf-meta-label">Relatório</div>
      <div class="pdf-meta-title">${title}</div>
      <div class="pdf-meta-info">Período: ${period}<br/>Gerado em: ${now}</div>
    </div>
  </div>
  <div class="pdf-accent"></div>
  <div class="pdf-body">
    ${bodyContent}
  </div>
  <div class="pdf-footer">
    <div class="pdf-footer-logo">Atende<span>+</span></div>
    <div class="pdf-footer-txt">Gerado pelo sistema Atende+ &nbsp;·&nbsp; ${now}</div>
  </div>
  <script>window.onload=function(){window.print()}<\/script>
  </body></html>`;
}

const nfTag = (a) => {
  const v = 'precisaDoc' in a ? a.precisaDoc : a.receitaSaude !== 'nao';
  return v ? '<span class="sim">Sim</span>' : '<span class="nao">Não</span>';
};

function pdfResumo(atend, desp, period) {
  const receitas  = atend.reduce((s,a) => s + (a.valorNum||0), 0);
  const despTotal = desp.reduce((s,d) => s + (d.valorNum||0), 0);
  const lucro     = receitas - despTotal;
  const ticket    = atend.length ? receitas / atend.length : 0;
  const body = `
    <div class="kpi-grid">
      <div class="kpi blue"><label>Receitas totais</label><strong>${fmt(receitas)}</strong></div>
      <div class="kpi red"><label>Despesas totais</label><strong>${fmt(despTotal)}</strong></div>
      <div class="kpi ${lucro>=0?'green':'red'}"><label>Lucro líquido</label><strong>${fmt(lucro)}</strong></div>
      <div class="kpi"><label>Atendimentos</label><strong>${atend.length}</strong></div>
      <div class="kpi"><label>Ticket médio</label><strong>${fmt(ticket)}</strong></div>
    </div>
    <h2>Atendimentos no período</h2>
    <table><thead><tr><th>Data</th><th>Paciente</th><th>Pagador</th><th>Valor</th><th>Pagamento</th><th>NF/Recibo</th></tr></thead>
    <tbody>${atend.map(a=>`<tr><td>${a.data}</td><td>${a.paciente}</td><td>${a.pagador||'—'}</td><td><strong>${a.valor||fmt(a.valorNum)}</strong></td><td>${a.formaPagamento||'—'}</td><td>${nfTag(a)}</td></tr>`).join('')}</tbody></table>`;
  return buildPDFWindow('Resumo Financeiro', period, body);
}

function pdfAtendimentos(atend, period) {
  const total = atend.reduce((s,a)=>s+(a.valorNum||0),0);
  const body = `
    <div class="kpi-grid" style="grid-template-columns:repeat(2,1fr)">
      <div class="kpi blue"><label>Total de atendimentos</label><strong>${atend.length}</strong></div>
      <div class="kpi green"><label>Total recebido</label><strong>${fmt(total)}</strong></div>
    </div>
    <h2>Lista de atendimentos</h2>
    <table><thead><tr><th>Data</th><th>Paciente</th><th>Pagador</th><th>Valor</th><th>Pagamento</th><th>Solicitou NF/Recibo</th></tr></thead>
    <tbody>${atend.map(a=>`<tr><td>${a.data}</td><td>${a.paciente}</td><td>${a.pagador||'—'}</td><td><strong>${a.valor||fmt(a.valorNum)}</strong></td><td>${a.formaPagamento||'—'}</td><td>${nfTag(a)}</td></tr>`).join('')}</tbody></table>`;
  return buildPDFWindow('Atendimentos Recebidos', period, body);
}

function pdfDespesas(desp, period) {
  const catTotals = {};
  desp.forEach(d => { catTotals[d.categoria] = (catTotals[d.categoria]||0) + d.valorNum; });
  const body = `
    <div class="kpi-grid" style="grid-template-columns:repeat(2,1fr)">
      <div class="kpi blue"><label>Total de despesas</label><strong>${desp.length}</strong></div>
      <div class="kpi red"><label>Valor total</label><strong>${fmt(desp.reduce((s,d)=>s+d.valorNum,0))}</strong></div>
    </div>
    <h2>Lista de despesas</h2>
    <table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Pagamento</th><th>Comprovante</th></tr></thead>
    <tbody>${desp.map(d=>`<tr><td>${d.data}</td><td>${d.descricao}</td><td>${d.categoria}</td><td><strong>${d.valor||fmt(d.valorNum)}</strong></td><td>${d.formaPagamento}</td><td>${d.comprovante?'<span class="sim">Sim</span>':'<span class="nao">Não</span>'}</td></tr>`).join('')}</tbody></table>
    <h2>Total por categoria</h2>
    <table><thead><tr><th>Categoria</th><th>Total</th></tr></thead>
    <tbody>${Object.entries(catTotals).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<tr><td>${c}</td><td><strong>${fmt(v)}</strong></td></tr>`).join('')}</tbody></table>`;
  return buildPDFWindow('Despesas', period, body);
}

function pdfContador(atend, desp, period) {
  const catTotals = {};
  desp.forEach(d => { catTotals[d.categoria] = (catTotals[d.categoria]||0) + d.valorNum; });
  const body = `
    <h2>Atendimentos (${atend.length})</h2>
    <table><thead><tr><th>Data</th><th>Paciente</th><th>Pagador</th><th>Valor</th><th>Pagamento</th><th>Solicitou NF/Recibo?</th></tr></thead>
    <tbody>${atend.map(a=>`<tr><td>${a.data}</td><td>${a.paciente}</td><td>${a.pagador||'—'}</td><td><strong>${a.valor||fmt(a.valorNum||0)}</strong></td><td>${a.formaPagamento||'—'}</td><td>${nfTag(a)}</td></tr>`).join('')}</tbody></table>
    <h2>Despesas (${desp.length})</h2>
    <table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Pagamento</th></tr></thead>
    <tbody>${desp.map(d=>`<tr><td>${d.data}</td><td>${d.descricao}</td><td>${d.categoria}</td><td><strong>${d.valor||fmt(d.valorNum)}</strong></td><td>${d.formaPagamento}</td></tr>`).join('')}</tbody></table>
    <h2>Despesas por categoria</h2>
    <table><thead><tr><th>Categoria</th><th>Total</th></tr></thead>
    <tbody>${Object.entries(catTotals).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<tr><td>${c}</td><td><strong>${fmt(v)}</strong></td></tr>`).join('')}</tbody></table>`;
  return buildPDFWindow('Relatório para Contador', period, body);
}

/* ── Helpers de formatação ── */
const fmtVal = (n) => Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── CSV simples (atendimentos / despesas individual) ── */
function downloadCSV(filename, header, rows) {
  const csv  = [header, ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function csvAtendimentos(atend) {
  const header = 'Data;Paciente;Pagador;Valor (R$);Forma de Pagamento;Solicitou NF/Recibo';
  const rows   = atend.map(a => {
    const nf = 'precisaDoc' in a ? (a.precisaDoc?'Sim':'Não') : (a.receitaSaude!=='nao'?'Sim':'Não');
    return [a.data, a.paciente, a.pagador||'', fmtVal(a.valorNum), a.formaPagamento||'', nf].join(';');
  });
  downloadCSV('atendimentos.csv', header, rows);
}

function csvDespesas(desp) {
  const header = 'Data;Descrição;Categoria;Valor (R$);Forma de Pagamento;Comprovante';
  const rows   = desp.map(d => [d.data, d.descricao, d.categoria, fmtVal(d.valorNum), d.formaPagamento, d.comprovante?'Sim':'Não'].join(';'));
  downloadCSV('despesas.csv', header, rows);
}

/* ── Excel com múltiplas abas (SpreadsheetML) ── */
function buildXLSCell(value, type = 'String') {
  const escaped = String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  return `<Cell><Data ss:Type="${type}">${escaped}</Data></Cell>`;
}

function buildXLSSheet(name, headers, rows) {
  const headerRow = `<Row>${headers.map(h => buildXLSCell(h)).join('')}</Row>`;
  const dataRows  = rows.map(row => `<Row>${row.map(c => buildXLSCell(c)).join('')}</Row>`).join('');
  return `<Worksheet ss:Name="${name}"><Table>${headerRow}${dataRows}</Table></Worksheet>`;
}

function downloadXLS(filename, sheets) {
  const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${sheets.join('\n')}
</Workbook>`;
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename + '.xls'; a.click();
  URL.revokeObjectURL(url);
}

function csvContador(atend, desp) {
  const sheetAtend = buildXLSSheet(
    'Atendimentos',
    ['Data', 'Paciente', 'Pagador', 'Valor (R$)', 'Forma de Pagamento', 'Solicitou NF/Recibo'],
    atend.map(a => {
      const nf = 'precisaDoc' in a ? (a.precisaDoc?'Sim':'Não') : (a.receitaSaude!=='nao'?'Sim':'Não');
      return [a.data, a.paciente, a.pagador||'—', fmtVal(a.valorNum), a.formaPagamento||'—', nf];
    })
  );

  const sheetDesp = buildXLSSheet(
    'Despesas',
    ['Data', 'Descrição', 'Categoria', 'Valor (R$)', 'Forma de Pagamento', 'Comprovante'],
    desp.map(d => [d.data, d.descricao, d.categoria, fmtVal(d.valorNum), d.formaPagamento, d.comprovante?'Sim':'Não'])
  );

  downloadXLS('relatorio-contador', [sheetAtend, sheetDesp]);
}

/* ════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ════════════════════════════════════════ */
export default function Relatorios() {
  const { atendimentos, despesas } = useData();
  const [periodStart,  setPeriodStart]  = useState('2024-05-01');
  const [periodEnd,    setPeriodEnd]    = useState('2024-05-31');
  const [reportType,   setReportType]   = useState('all');
  const [generated,    setGenerated]    = useState(INITIAL_REPORTS);
  const [page,         setPage]         = useState(1);
  const [menuOpen,     setMenuOpen]     = useState(null);
  const [menuPos,      setMenuPos]      = useState({ top: 0, right: 0 });
  const menuRef = useRef(null);

  const periodLabel = `${isoToBR(periodStart)} - ${isoToBR(periodEnd)}`;

  /* ── Filtra dados pelo período ── */
  const start = parseDateISO(periodStart);
  const end   = parseDateISO(periodEnd);
  if (end) end.setHours(23,59,59);

  const atendFiltered = useMemo(() => atendimentos.filter(a => {
    const d = parseDateBR(a.data);
    return d && d >= start && d <= end;
  }), [atendimentos, periodStart, periodEnd]);

  const despFiltered = useMemo(() => despesas.filter(d => {
    const dt = parseDateBR(d.data);
    return dt && dt >= start && dt <= end;
  }), [despesas, periodStart, periodEnd]);

  /* ── Filtra relatórios gerados pelo tipo ── */
  const filteredReports = useMemo(() =>
    generated.filter(r => reportType === 'all' || r.tipo === reportType),
    [generated, reportType]
  );
  const totalPages = Math.ceil(filteredReports.length / PER_PAGE);
  const paginated  = filteredReports.slice((page-1)*PER_PAGE, page*PER_PAGE);

  /* ── Tipos para selecionar ── */
  const typesToGenerate = reportType === 'all'
    ? ['resumo','atendimentos','despesas','contador']
    : [reportType];

  /* ── Gerar relatório ── */
  function handleGenerate() {
    const newReports = typesToGenerate.map((tipo, i) => ({
      id: Date.now() + i,
      nome: `${TYPE_LABELS[tipo]} - ${new Date(periodEnd).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^\w/,c=>c.toUpperCase())}`,
      tipo,
      periodo: periodLabel,
      geradoEm: nowLabel(),
      formato: tipo === 'atendimentos' ? 'CSV' : 'PDF',
    }));
    setGenerated(prev => [...newReports, ...prev]);
    setPage(1);
  }

  /* ── Export PDF ── */
  function exportPDF(tipo) {
    const period = periodLabel;
    let html = '';
    if (tipo === 'resumo')        html = pdfResumo(atendFiltered, despFiltered, period);
    else if (tipo === 'atendimentos') html = pdfAtendimentos(atendFiltered, period);
    else if (tipo === 'despesas')     html = pdfDespesas(despFiltered, period);
    else if (tipo === 'contador')     html = pdfContador(atendFiltered, despFiltered, period);
    else html = pdfResumo(atendFiltered, despFiltered, period);
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  }

  /* ── Export CSV ── */
  function exportCSV(tipo) {
    if (tipo === 'atendimentos') csvAtendimentos(atendFiltered);
    else if (tipo === 'despesas') csvDespesas(despFiltered);
    else if (tipo === 'contador') csvContador(atendFiltered, despFiltered);
    else { csvAtendimentos(atendFiltered); csvDespesas(despFiltered); }
  }

  /* ── Download de relatório gerado ── */
  function downloadReport(r) {
    if (r.formato === 'CSV') exportCSV(r.tipo);
    else exportPDF(r.tipo);
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="content-area">
        <Header
          title="Relatórios"
          subtitle="Gere relatórios financeiros e de atendimentos do seu consultório."
        />

        <div className="main-content">

          {/* ── Barra de controles ── */}
          <div className="surface-card rel-control-bar">
            {/* Período */}
            <div className="rel-period-wrap">
              <label className="rel-period-label">Período</label>
              <div className="rel-period-inputs">
                <CalendarDays size={15} className="rel-period-icon" />
                <input type="date" className="rel-date-input" value={periodStart}
                  onChange={e => setPeriodStart(e.target.value)} />
                <span className="rel-period-sep">—</span>
                <input type="date" className="rel-date-input" value={periodEnd}
                  onChange={e => setPeriodEnd(e.target.value)} />
              </div>
            </div>

            {/* Tipo de relatório */}
            <div className="rel-type-wrap">
              <label className="rel-period-label">Tipo de relatório</label>
              <div className="desp-filter-select-wrap" style={{ minWidth: 220 }}>
                <BarChart2 size={14} className="desp-filter-icon" />
                <select className="desp-filter-select" value={reportType}
                  onChange={e => { setReportType(e.target.value); setPage(1); }}>
                  <option value="all">Todos os relatórios</option>
                  <option value="resumo">Resumo financeiro</option>
                  <option value="atendimentos">Atendimentos recebidos</option>
                  <option value="despesas">Despesas</option>
                  <option value="contador">Relatório para contador</option>
                </select>
                <ChevronDown size={13} className="desp-filter-chevron" />
              </div>
            </div>

            <div className="rel-actions">
              <button className="btn btn-primary btn-sm" onClick={handleGenerate}>
                <FileText size={15} /> Gerar relatório
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => exportPDF(reportType === 'all' ? 'resumo' : reportType)}>
                <FileText size={15} style={{ color:'#ef4444' }} /> Exportar PDF
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(reportType === 'all' ? 'atendimentos' : reportType)}>
                <FileSpreadsheet size={15} style={{ color:'#22c55e' }} /> Exportar CSV
              </button>
            </div>
          </div>

          {/* ── Cards de relatórios disponíveis ── */}
          <div className="rel-section">
            <h2 className="rel-section-title">Relatórios disponíveis</h2>
            <div className="rel-cards-grid">
              {REPORT_CARDS.map(card => (
                <div key={card.key} className="surface-card rel-card"
                  onClick={() => { setReportType(card.key); exportPDF(card.key); }}>
                  <div className="rel-card-header">
                    <div className="rel-card-icon" style={{ background: card.bg, color: card.color }}>
                      <card.Icon size={22} />
                    </div>
                    <div>
                      <h3 className="rel-card-title">{card.label}</h3>
                      <p className="rel-card-desc">{card.desc}</p>
                    </div>
                  </div>
                  <ul className="rel-card-items">
                    {card.items.map(item => (
                      <li key={item}>
                        <span className="rel-check" style={{ color: card.color }}><Check size={13} /></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* ── Histórico de relatórios gerados ── */}
          <div className="surface-card rel-history-card">
            <div className="rel-history-header">
              <h2 className="rel-section-title" style={{ margin: 0 }}>Relatórios gerados</h2>
              <span className="rel-history-count">{filteredReports.length} relatório{filteredReports.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="table-wrap">
              <table className="atendimento-table rel-table">
                <thead>
                  <tr>
                    <th>Nome do relatório</th>
                    <th>Tipo</th>
                    <th>Período</th>
                    <th>Gerado em</th>
                    <th>Formato</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <span className="rel-row-icon" style={{ color: TYPE_COLORS[r.tipo] }}>
                            <FileText size={17} />
                          </span>
                          <span style={{ fontWeight:500 }}>{r.nome}</span>
                        </div>
                      </td>
                      <td>
                        <span className="rel-type-pill" style={{
                          background: TYPE_COLORS[r.tipo] + '22',
                          color: TYPE_COLORS[r.tipo],
                          border: `1px solid ${TYPE_COLORS[r.tipo]}44`,
                        }}>
                          {TYPE_LABELS[r.tipo]}
                        </span>
                      </td>
                      <td className="table-cell-muted">{r.periodo}</td>
                      <td className="table-cell-muted">{r.geradoEm}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          {r.formato === 'PDF'
                            ? <FileText size={14} color="#ef4444" />
                            : <FileSpreadsheet size={14} color="#22c55e" />}
                          <span style={{ fontWeight:600, fontSize:'0.82rem' }}>{r.formato}</span>
                        </div>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="icon-btn" title="Download" onClick={() => downloadReport(r)}>
                            <Download size={15} />
                          </button>
                          <div style={{ position:'relative' }}>
                            <button className="icon-btn" title="Mais opções"
                              onClick={(e) => {
                                if (menuOpen === r.id) { setMenuOpen(null); return; }
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                                setMenuOpen(r.id);
                              }}>
                              <MoreVertical size={15} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign:'center', padding:'32px', color:'var(--text-muted)' }}>
                        Nenhum relatório encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-pagination">
              <span className="pagination-info">
                Mostrando {filteredReports.length === 0 ? 0 : Math.min((page-1)*PER_PAGE+1, filteredReports.length)} a {Math.min(page*PER_PAGE, filteredReports.length)} de {filteredReports.length} relatórios
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
      {/* Dropdown fixo — renderizado fora da tabela para não ser cortado */}
      {menuOpen !== null && (
        <>
          <div style={{ position:'fixed', inset:0, zIndex:998 }} onClick={() => setMenuOpen(null)} />
          <div className="rel-dropdown" style={{ position:'fixed', top: menuPos.top, right: menuPos.right, zIndex:999 }}>
            {(() => {
              const r = generated.find(x => x.id === menuOpen);
              if (!r) return null;
              return (<>
                <button onClick={() => { downloadReport(r); setMenuOpen(null); }}>
                  <Download size={13} /> Download
                </button>
                <button className="rel-dropdown-danger"
                  onClick={() => { setGenerated(prev => prev.filter(x => x.id !== r.id)); setMenuOpen(null); }}>
                  Excluir
                </button>
              </>);
            })()}
          </div>
        </>
      )}
    </div>
  );
}
