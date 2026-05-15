import { AlertCircle, CreditCard, DollarSign, Eye, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AtendimentoForm from '../components/AtendimentoForm.jsx';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useData } from '../contexts/DataContext.jsx';
import { useState } from 'react';

function fmt(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}
function formatDate(value) {
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}
function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

const SIT_PILL = {
  pendente:  { cls: 'pill pill-orange', label: 'Pendente'  },
  concluido: { cls: 'pill pill-green',  label: 'Concluído' },
  cancelado: { cls: 'pill pill-red',    label: 'Cancelado' },
};
const DOC_PILL = {
  pendente: { cls: 'pill pill-orange', label: 'Pendente' },
  completa: { cls: 'pill pill-green',  label: 'Completa' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { atendimentos, despesas, addAtendimento, updateAtendimento, deleteAtendimento } = useData();
  const [modal, setModal] = useState({ open: false, editing: null });

  const totalRecebido  = atendimentos.reduce((s, a) => s + (a.valorNum || 0), 0);
  const totalDespesas  = despesas.reduce((s, d) => s + (d.valorNum || 0), 0);
  const lucro          = totalRecebido - totalDespesas;
  const pendencias     = atendimentos.filter((a) => a.situacao === 'pendente').length;
  const recentes       = atendimentos.slice(0, 5);

  function closeModal() { setModal({ open: false, editing: null }); }

  function handleSubmit(payload) {
    const num = parseFloat(String(payload.valorRecebido || '0').replace(',', '.')) || 0;
    const item = {
      data: formatDate(payload.dataAtendimento),
      hora: '—',
      paciente: payload.pacienteNome,
      pagador: payload.pagadorNome,
      cpfPaciente: payload.pacienteCpf,
      cpfPagador: payload.pagadorDoc,
      valorNum: num,
      valor: formatCurrency(num),
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
        <Header onNovoAtendimento={() => setModal({ open: true, editing: null })} />

        <div className="main-content">

          {/* ── 4 Cards de resumo ── */}
          <section className="summary-grid summary-grid-4" aria-label="Resumo financeiro">

            <div className="summary-card surface-card">
              <div className="summary-icon summary-icon-green">
                <DollarSign size={22} />
              </div>
              <div className="summary-content">
                <p>Recebimentos do mês</p>
                <strong>{fmt(totalRecebido)}</strong>
                <div className="summary-trend">↑ 12% em relação ao mês anterior</div>
              </div>
            </div>

            <div className="summary-card surface-card">
              <div className="summary-icon summary-icon-pink">
                <CreditCard size={22} />
              </div>
              <div className="summary-content">
                <p>Despesas do mês</p>
                <strong>{fmt(totalDespesas)}</strong>
                <div className="summary-trend">↑ 8% em relação ao mês anterior</div>
              </div>
            </div>

            <div className="summary-card surface-card">
              <div className="summary-icon summary-icon-blue">
                <TrendingUp size={22} />
              </div>
              <div className="summary-content">
                <p>Lucro estimado</p>
                <strong>{fmt(lucro)}</strong>
                <div className="summary-trend">↑ 15% em relação ao mês anterior</div>
              </div>
            </div>

            <div className="summary-card surface-card">
              <div className="summary-icon summary-icon-orange">
                <AlertCircle size={22} />
              </div>
              <div className="summary-content">
                <p>Pendências</p>
                <strong>{pendencias}</strong>
                <div className="summary-trend summary-trend-warning">atendimentos pendentes</div>
              </div>
            </div>

          </section>

          {/* ── Tabela resumo atendimentos ── */}
          <div className="surface-card data-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>Últimos atendimentos</h2>
              <button
                className="see-all-link"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                onClick={() => navigate('/atendimentos')}
              >
                Ver todos os atendimentos →
              </button>
            </div>

            <div className="table-wrap">
              <table className="atendimento-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Paciente</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Documentação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {recentes.map((a) => {
                    const sit = SIT_PILL[a.situacao] || SIT_PILL.pendente;
                    const doc = DOC_PILL[a.documentacao] || DOC_PILL.pendente;
                    return (
                      <tr key={a.id}>
                        <td className="table-cell-muted">{a.data}</td>
                        <td>{a.paciente}</td>
                        <td><strong>{a.valor}</strong></td>
                        <td><span className={sit.cls}>{sit.label}</span></td>
                        <td><span className={doc.cls}>{doc.label}</span></td>
                        <td>
                          <button className="icon-btn" title="Visualizar"><Eye size={15} /></button>
                        </td>
                      </tr>
                    );
                  })}
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
