import {
  Banknote, CalendarDays, CreditCard, DollarSign, Eye,
  QrCode, Search, TrendingDown, TrendingUp, Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import AtendimentoForm from '../components/AtendimentoForm.jsx';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useData } from '../contexts/DataContext.jsx';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const CAT_COLORS = {
  Aluguel: '#6366f1',
  Energia: '#f59e0b',
  Água: '#06b6d4',
  Internet: '#3b82f6',
  Telefone: '#8b5cf6',
  'Software / Sistema': '#ec4899',
  Assinaturas: '#a855f7',
  'Conselho profissional': '#14b8a6',
  Contador: '#0ea5e9',
  Secretária: '#f472b6',
  Marketing: '#22c55e',
  Combustível: '#f97316',
  Transporte: '#fb923c',
  Materiais: '#eab308',
  Equipamentos: '#84cc16',
  Manutenção: '#10b981',
  Impostos: '#ef4444',
  Taxas: '#dc2626',
  Cursos: '#6366f1',
  Limpeza: '#67e8f9',
  Alimentação: '#fdba74',
  Outros: '#94a3b8',
};

const SIT_PILL = {
  pendente:  { cls: 'pill pill-orange', label: 'Pendente' },
  concluido: { cls: 'pill pill-green',  label: 'Concluído' },
  cancelado: { cls: 'pill pill-red',    label: 'Cancelado' },
};

const PAYMENT_ICON = {
  PIX: <><QrCode size={12} /> PIX</>,
  Pix: <><QrCode size={12} /> Pix</>,
  Cartão: <><CreditCard size={12} /> Cartão</>,
  Crédito: <><CreditCard size={12} /> Crédito</>,
  Débito: <><CreditCard size={12} /> Débito</>,
  Dinheiro: <><Banknote size={12} /> Dinheiro</>,
  Transferência: <><Wallet size={12} /> Transf.</>,
};

function fmt(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);
}

function formatDate(value) {
  const [y, m, d] = String(value || '').split('-');
  if (!y || !m || !d) return value || '';
  return `${d}/${m}/${y}`;
}

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

function parseDateBR(value) {
  if (!value) return null;
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return new Date(`${text.slice(0, 10)}T00:00:00`);
  const [d, m, y] = text.split('/');
  if (!d || !m || !y) return null;
  return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`);
}

function dateToISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getFirstOfMonth(date = new Date()) {
  return dateToISO(new Date(date.getFullYear(), date.getMonth(), 1));
}

function getLastOfMonth(date = new Date()) {
  return dateToISO(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function getLatestDataPeriod(atendimentos, despesas) {
  const dates = [...atendimentos, ...despesas]
    .map((item) => parseDateBR(item.data))
    .filter(Boolean);
  if (!dates.length) return { start: getFirstOfMonth(), end: getLastOfMonth() };
  const latest = new Date(Math.max(...dates.map((d) => d.getTime())));
  return { start: getFirstOfMonth(latest), end: getLastOfMonth(latest) };
}

function isInsidePeriod(item, start, end) {
  const date = parseDateBR(item.data);
  if (!date || !start || !end) return false;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T23:59:59`);
  return date >= startDate && date <= endDate;
}

function getPreviousMonthPeriod(start) {
  const ref = new Date(`${start}T00:00:00`);
  const previous = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
  return { start: getFirstOfMonth(previous), end: getLastOfMonth(previous) };
}

function sumValues(items) {
  return items.reduce((sum, item) => sum + (Number(item.valorNum) || 0), 0);
}

function trendInfo(current, previous, hasPreviousComparison) {
  if (!hasPreviousComparison || previous === 0) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const arrow = pct >= 0 ? '↑' : '↓';
  return {
    text: `${arrow} ${Math.abs(pct).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% em relação ao mês anterior`,
    tone: pct >= 0 ? 'up' : 'down',
  };
}

function paymentClass(forma = 'PIX') {
  const map = {
    PIX: 'pix',
    Pix: 'pix',
    Cartão: 'cartao',
    Crédito: 'credito',
    Débito: 'debito',
    Dinheiro: 'dinheiro',
    Transferência: 'cartao',
  };
  return `pagto-chip pagto-${map[forma] || 'pix'}`;
}

function statusKey(item) {
  return item.situacao || (item.recebimento === 'recebido' ? 'concluido' : 'pendente');
}

function Sparkline({ values, color }) {
  const safeValues = values.length ? values : [0, 0];
  const min = Math.min(...safeValues, 0);
  const max = Math.max(...safeValues, 1);
  const range = max - min || 1;
  const points = safeValues.map((value, index) => {
    const x = safeValues.length === 1 ? 88 : (index / (safeValues.length - 1)) * 88;
    const y = 38 - ((value - min) / range) * 30;
    return `${x + 4},${y}`;
  }).join(' ');

  return (
    <svg className="summary-sparkline" viewBox="0 0 96 44" width="112" height="52" aria-hidden="true">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`4,42 ${points} 92,42`} fill={`url(#spark-${color.replace('#', '')})`} stroke="none" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { atendimentos, despesas, addAtendimento, updateAtendimento } = useData();
  const suggestedPeriod = useMemo(() => getLatestDataPeriod(atendimentos, despesas), [atendimentos, despesas]);

  const [periodTouched, setPeriodTouched] = useState(false);
  const [periodStart, setPeriodStart] = useState(suggestedPeriod.start);
  const [periodEnd, setPeriodEnd] = useState(suggestedPeriod.end);
  const [draftStart, setDraftStart] = useState(suggestedPeriod.start);
  const [draftEnd, setDraftEnd] = useState(suggestedPeriod.end);
  const [chartYear, setChartYear] = useState(String(new Date().getFullYear()));
  const [expenseScope, setExpenseScope] = useState('period');
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState({ open: false, editing: null });

  useEffect(() => {
    if (periodTouched) return;
    setPeriodStart(suggestedPeriod.start);
    setPeriodEnd(suggestedPeriod.end);
    setDraftStart(suggestedPeriod.start);
    setDraftEnd(suggestedPeriod.end);
  }, [periodTouched, suggestedPeriod.start, suggestedPeriod.end]);

  const yearOptions = useMemo(() => {
    const years = new Set([new Date().getFullYear()]);
    [...atendimentos, ...despesas].forEach((item) => {
      const date = parseDateBR(item.data);
      if (date) years.add(date.getFullYear());
    });
    return [...years].sort((a, b) => b - a).map(String);
  }, [atendimentos, despesas]);

  useEffect(() => {
    if (yearOptions.length && !yearOptions.includes(chartYear)) setChartYear(yearOptions[0]);
  }, [chartYear, yearOptions]);

  const periodAtendimentos = useMemo(
    () => atendimentos.filter((item) => isInsidePeriod(item, periodStart, periodEnd)),
    [atendimentos, periodStart, periodEnd]
  );

  const periodDespesas = useMemo(
    () => despesas.filter((item) => isInsidePeriod(item, periodStart, periodEnd)),
    [despesas, periodStart, periodEnd]
  );

  const previousPeriod = useMemo(() => getPreviousMonthPeriod(periodStart), [periodStart]);
  const previousAtendimentos = useMemo(
    () => atendimentos.filter((item) => isInsidePeriod(item, previousPeriod.start, previousPeriod.end)),
    [atendimentos, previousPeriod.start, previousPeriod.end]
  );
  const previousDespesas = useMemo(
    () => despesas.filter((item) => isInsidePeriod(item, previousPeriod.start, previousPeriod.end)),
    [despesas, previousPeriod.start, previousPeriod.end]
  );

  const totalRecebido = sumValues(periodAtendimentos);
  const totalDespesas = sumValues(periodDespesas);
  const lucro = totalRecebido - totalDespesas;
  const isPrejuizo = lucro < 0;
  const ticketMedio = periodAtendimentos.length ? totalRecebido / periodAtendimentos.length : 0;

  const previousRecebido = sumValues(previousAtendimentos);
  const previousTotalDespesas = sumValues(previousDespesas);
  const previousLucro = previousRecebido - previousTotalDespesas;
  const hasPreviousRevenue = previousAtendimentos.length > 0;
  const hasPreviousExpenses = previousDespesas.length > 0;
  const hasPreviousResult = hasPreviousRevenue || hasPreviousExpenses;
  const receitaTrend = trendInfo(totalRecebido, previousRecebido, hasPreviousRevenue);
  const despesasTrend = trendInfo(totalDespesas, previousTotalDespesas, hasPreviousExpenses);
  const lucroTrend = trendInfo(lucro, previousLucro, hasPreviousResult);

  const chartData = useMemo(() => {
    const rows = MONTHS.map((month) => ({
      month,
      receita: 0,
      despesa: 0,
      lucro: 0,
      receitaAcumulada: 0,
    }));

    atendimentos.forEach((item) => {
      const date = parseDateBR(item.data);
      if (date && String(date.getFullYear()) === chartYear) rows[date.getMonth()].receita += Number(item.valorNum) || 0;
    });
    despesas.forEach((item) => {
      const date = parseDateBR(item.data);
      if (date && String(date.getFullYear()) === chartYear) rows[date.getMonth()].despesa += Number(item.valorNum) || 0;
    });

    let accumulated = 0;
    return rows.map((row) => {
      accumulated += row.receita;
      return { ...row, lucro: row.receita - row.despesa, receitaAcumulada: accumulated };
    });
  }, [atendimentos, despesas, chartYear]);

  const donutData = useMemo(() => {
    const source = expenseScope === 'all' ? despesas : periodDespesas;
    const totals = {};
    source.forEach((item) => {
      const cat = item.categoria || 'Outros';
      totals[cat] = (totals[cat] || 0) + (Number(item.valorNum) || 0);
    });

    const ordered = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const top = ordered.slice(0, 5);
    const rest = ordered.slice(5).reduce((sum, [, value]) => sum + value, 0);
    return [
      ...top.map(([name, value]) => ({ name, value, color: CAT_COLORS[name] || CAT_COLORS.Outros })),
      ...(rest > 0 ? [{ name: 'Outros', value: rest, color: CAT_COLORS.Outros }] : []),
    ];
  }, [despesas, expenseScope, periodDespesas]);

  const donutTotal = donutData.reduce((sum, item) => sum + item.value, 0);

  const tableItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return periodAtendimentos
      .filter((item) => {
        const matchesSearch = !q
          || item.paciente?.toLowerCase().includes(q)
          || item.pagador?.toLowerCase().includes(q)
          || item.cpfPaciente?.includes(q);
        const matchesStatus = !statusFilter || statusKey(item) === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => (parseDateBR(b.data)?.getTime() || 0) - (parseDateBR(a.data)?.getTime() || 0))
      .slice(0, 5);
  }, [periodAtendimentos, statusFilter, tableSearch]);

  function applyPeriod() {
    if (!draftStart || !draftEnd) return;
    if (new Date(`${draftStart}T00:00:00`) > new Date(`${draftEnd}T00:00:00`)) return;
    setPeriodTouched(true);
    setPeriodStart(draftStart);
    setPeriodEnd(draftEnd);
  }

  function closeModal() {
    setModal({ open: false, editing: null });
  }

  function handleSubmit(payload) {
    const payloadValue = Number(payload.valor);
    const num = Number.isFinite(payloadValue)
      ? payloadValue
      : parseFloat(String(payload.valorRecebido || '0').replace(/\./g, '').replace(',', '.')) || 0;
    const item = {
      ...payload,
      data: formatDate(payload.dataAtendimento),
      hora: payload.hora || '—',
      paciente: payload.pacienteNome,
      pagador: payload.pagadorNome,
      cpfPaciente: payload.pacienteCpf,
      cpfPagador: payload.pagadorDoc,
      valorNum: num,
      valor: formatCurrency(num),
      situacao: 'concluido',
      recebimento: 'recebido',
      servico: payload.servico || 'Consulta',
      formaPagamento: payload.formaPagamento || 'PIX',
      documentacao: payload.precisaDoc ? 'pendente' : 'completa',
      nfStatus: payload.precisaDoc ? 'pendente' : 'emitido',
      receitaSaude: 'pronto',
    };
    if (modal.editing) updateAtendimento(modal.editing.id, item);
    else addAtendimento(item);
    closeModal();
  }

  const summarySparkValues = {
    receita: chartData.map((item) => item.receita),
    despesa: chartData.map((item) => item.despesa),
    lucro: chartData.map((item) => item.lucro),
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="content-area">
        <Header onNovoAtendimento={() => setModal({ open: true, editing: null })} />

        <div className="main-content">
          <section className="summary-grid" aria-label="Resumo financeiro">
            <div className="summary-card surface-card">
              <div className="summary-icon summary-icon-green">
                <DollarSign size={22} />
              </div>
              <div className="summary-content">
                <p>Recebimentos do mês</p>
                <strong>{fmt(totalRecebido)}</strong>
                {receitaTrend && (
                  <div className="summary-trend">
                    {receitaTrend.text}
                  </div>
                )}
              </div>
              <Sparkline values={summarySparkValues.receita} color="#10b981" />
            </div>

            <div className="summary-card surface-card">
              <div className="summary-icon summary-icon-pink">
                <CreditCard size={22} />
              </div>
              <div className="summary-content">
                <p>Despesas do mês</p>
                <strong>{fmt(totalDespesas)}</strong>
                {despesasTrend && (
                  <div className={`summary-trend${despesasTrend.tone === 'up' ? ' summary-trend-warning' : ''}`}>
                    {despesasTrend.text}
                  </div>
                )}
              </div>
              <Sparkline values={summarySparkValues.despesa} color="#ec4899" />
            </div>

            <div className="summary-card surface-card">
              <div className={`summary-icon ${isPrejuizo ? 'summary-icon-orange' : 'summary-icon-blue'}`}>
                {isPrejuizo ? <TrendingDown size={22} /> : <TrendingUp size={22} />}
              </div>
              <div className="summary-content">
                <p>{isPrejuizo ? 'Prejuízo' : 'Lucro líquido'}</p>
                <strong className={isPrejuizo ? 'summary-value-negative' : ''}>{fmt(lucro)}</strong>
                {isPrejuizo ? (
                  <div className="summary-trend summary-trend-warning">
                    despesas acima dos recebimentos
                  </div>
                ) : lucroTrend && (
                  <div className={`summary-trend${lucroTrend.tone === 'down' ? ' summary-trend-warning' : ''}`}>
                    {lucroTrend.text}
                  </div>
                )}
              </div>
              <Sparkline values={summarySparkValues.lucro} color={isPrejuizo ? '#f59e0b' : '#7c3aed'} />
            </div>
          </section>

          <section className="surface-card stats-bar" aria-label="Indicadores do período">
            <div className="stats-item">
              <span className="stats-label"><span className="stats-dot stats-dot-green" />Receita total</span>
              <strong>{fmt(totalRecebido)}</strong>
            </div>
            <span className="stats-sep" />
            <div className="stats-item">
              <span className="stats-label"><span className="stats-dot stats-dot-pink" />Despesa total</span>
              <strong>{fmt(totalDespesas)}</strong>
            </div>
            <span className="stats-sep" />
            <div className="stats-item">
              <span className="stats-label"><span className="stats-dot stats-dot-blue" />Lucro líquido</span>
              <strong>{fmt(lucro)}</strong>
            </div>
            <span className="stats-sep" />
            <div className="stats-item">
              <span className="stats-label"><span className="stats-dot stats-dot-purple" />Atendimentos</span>
              <strong>{periodAtendimentos.length}</strong>
            </div>
            <span className="stats-sep" />
            <div className="stats-item">
              <span className="stats-label"><span className="stats-dot stats-dot-orange" />Ticket médio</span>
              <strong>{fmt(ticketMedio)}</strong>
            </div>
            <div className="stats-spacer" />
            <div className="stats-daterange">
              <input
                type="date"
                className="stats-date-input"
                value={draftStart}
                onChange={(e) => setDraftStart(e.target.value)}
              />
              <span className="stats-date-sep">-</span>
              <input
                type="date"
                className="stats-date-input"
                value={draftEnd}
                onChange={(e) => setDraftEnd(e.target.value)}
              />
              <button type="button" className="btn btn-primary btn-sm stats-apply-btn" onClick={applyPeriod}>
                Aplicar
              </button>
            </div>
          </section>

          <section className="charts-row" aria-label="Gráficos financeiros">
            <div className="surface-card charts-card">
              <div className="charts-card-header">
                <h2>Evolução da receita (acumulada)</h2>
                <select className="chart-period-select" value={chartYear} onChange={(e) => setChartYear(e.target.value)}>
                  {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
              <div className="dash-area-chart">
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="receitaDashGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <YAxis hide domain={[0, 'dataMax + 100']} />
                    <Tooltip
                      formatter={(value) => [fmt(value), 'Receita acumulada']}
                      contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="receitaAcumulada"
                      stroke="#7c3aed"
                      strokeWidth={3}
                      fill="url(#receitaDashGradient)"
                      dot={{ r: 3, strokeWidth: 0, fill: '#7c3aed' }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="surface-card charts-card">
              <div className="charts-card-header">
                <h2>Despesas por categoria</h2>
                <select className="chart-period-select" value={expenseScope} onChange={(e) => setExpenseScope(e.target.value)}>
                  <option value="period">Período aplicado</option>
                  <option value="all">Todos os meses</option>
                </select>
              </div>
              <div className="donut-layout">
                <div className="donut-chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData.length ? donutData : [{ name: 'Sem despesas', value: 1, color: '#94a3b8' }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        {(donutData.length ? donutData : [{ color: '#94a3b8' }]).map((item, idx) => (
                          <Cell key={idx} fill={item.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [donutData.length ? fmt(value) : fmt(0), name]}
                        contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center">
                    <span>Total</span>
                    <strong>{fmt(donutTotal)}</strong>
                  </div>
                </div>

                <div className="donut-legend">
                  {donutData.length ? donutData.map((cat) => (
                    <div key={cat.name} className="donut-legend-row">
                      <span className="donut-dot" style={{ background: cat.color }} />
                      <span className="donut-cat-name">{cat.name}</span>
                      <span className="donut-cat-pct">{donutTotal ? Math.round((cat.value / donutTotal) * 100) : 0}%</span>
                      <span className="donut-cat-val">{fmt(cat.value)}</span>
                    </div>
                  )) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0 }}>Sem despesas no período</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="surface-card data-card">
            <div className="dash-table-header">
              <h2>Últimos atendimentos</h2>
              <div className="dash-table-controls">
                <span className="search-bar">
                  <Search size={15} />
                  <input
                    placeholder="Buscar paciente"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                  />
                </span>
                <select className="status-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">Todos os status</option>
                  <option value="concluido">Concluído</option>
                  <option value="pendente">Pendente</option>
                  <option value="cancelado">Cancelado</option>
                </select>
                <button
                  type="button"
                  className="see-all-link"
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                  onClick={() => navigate('/atendimentos')}
                >
                  Ver todos →
                </button>
              </div>
            </div>

            <div className="table-wrap">
              <table className="atendimento-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Paciente</th>
                    <th>Serviço</th>
                    <th>Valor</th>
                    <th>Forma pagamento</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tableItems.map((item) => {
                    const sit = SIT_PILL[statusKey(item)] || SIT_PILL.pendente;
                    const forma = item.formaPagamento || 'PIX';
                    return (
                      <tr key={item.id}>
                        <td className="table-cell-muted">{item.data}</td>
                        <td>{item.paciente}</td>
                        <td className="table-cell-muted">{item.servico || 'Consulta'}</td>
                        <td><strong>{item.valor || fmt(item.valorNum)}</strong></td>
                        <td>
                          <span className={paymentClass(forma)}>{PAYMENT_ICON[forma] || forma}</span>
                        </td>
                        <td><span className={sit.cls}>{sit.label}</span></td>
                        <td>
                          <button className="icon-btn" title="Abrir atendimento" onClick={() => setModal({ open: true, editing: item })}>
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {tableItems.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                        Nenhum atendimento encontrado no período selecionado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
