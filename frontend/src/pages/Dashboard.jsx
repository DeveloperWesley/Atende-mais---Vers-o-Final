import { CalendarDays, FileText, Users, WalletCards } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AtendimentoForm from '../components/AtendimentoForm.jsx';
import AtendimentoTable from '../components/AtendimentoTable.jsx';
import CardResumo from '../components/CardResumo.jsx';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';

const mockAtendimentos = [
  {
    id: 1,
    data: '24/05/2024',
    paciente: 'Maria Oliveira',
    pagador: 'Maria Oliveira',
    valor: 'R$ 250,00',
    precisaDoc: true,
    dataAtendimento: '2024-05-24',
    valorRecebido: '250,00',
    pagadorNome: 'Maria Oliveira',
    pagadorDoc: '12345678901',
    pacienteMesmoPagador: true,
    pacienteNome: 'Maria Oliveira',
    pacienteCpf: '12345678901',
    observacoes: ''
  },
  {
    id: 2,
    data: '23/05/2024',
    paciente: 'João Santos',
    pagador: 'João Santos',
    valor: 'R$ 180,00',
    precisaDoc: false,
    dataAtendimento: '2024-05-23',
    valorRecebido: '180,00',
    pagadorNome: 'João Santos',
    pagadorDoc: '98765432100',
    pacienteMesmoPagador: true,
    pacienteNome: 'João Santos',
    pacienteCpf: '98765432100',
    observacoes: ''
  },
  {
    id: 3,
    data: '22/05/2024',
    paciente: 'Ana Paula Souza',
    pagador: 'Ana Paula Souza',
    valor: 'R$ 300,00',
    precisaDoc: true,
    dataAtendimento: '2024-05-22',
    valorRecebido: '300,00',
    pagadorNome: 'Ana Paula Souza',
    pagadorDoc: '45678912300',
    pacienteMesmoPagador: true,
    pacienteNome: 'Ana Paula Souza',
    pacienteCpf: '45678912300',
    observacoes: ''
  },
  {
    id: 4,
    data: '21/05/2024',
    paciente: 'Carlos Lima',
    pagador: 'Empresa XYZ Ltda',
    valor: 'R$ 500,00',
    precisaDoc: true,
    dataAtendimento: '2024-05-21',
    valorRecebido: '500,00',
    pagadorNome: 'Empresa XYZ Ltda',
    pagadorDoc: '12345678000190',
    pacienteMesmoPagador: false,
    pacienteNome: 'Carlos Lima',
    pacienteCpf: '11122233344',
    observacoes: ''
  },
  {
    id: 5,
    data: '20/05/2024',
    paciente: 'Juliana Pereira',
    pagador: 'Juliana Pereira',
    valor: 'R$ 200,00',
    precisaDoc: false,
    dataAtendimento: '2024-05-20',
    valorRecebido: '200,00',
    pagadorNome: 'Juliana Pereira',
    pagadorDoc: '22233344455',
    pacienteMesmoPagador: true,
    pacienteNome: 'Juliana Pereira',
    pacienteCpf: '22233344455',
    observacoes: ''
  }
];

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatDate(value) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [atendimentos, setAtendimentos] = useState(mockAtendimentos);
  const [formState, setFormState] = useState({ open: false, editing: null });

  const resumo = {
    quantidade: 12,
    total: 3250,
    pendentesDoc: 5
  };

  function closeForm() {
    setFormState({ open: false, editing: null });
  }

  function handleSubmit(payload) {
    const item = {
      id: formState.editing?.id || Date.now(),
      data: formatDate(payload.dataAtendimento),
      paciente: payload.pacienteNome,
      pagador: payload.pagadorNome,
      valor: formatCurrency(payload.valor),
      precisaDoc: payload.precisaDoc,
      ...payload,
      valorRecebido: payload.valorRecebido
    };

    // TODO: substituir dados mockados
    setAtendimentos((current) =>
      formState.editing
        ? current.map((atendimento) => (atendimento.id === formState.editing.id ? item : atendimento))
        : [item, ...current]
    );
    closeForm();
  }

  function handleDelete(id) {
    // TODO: integrar com API real
    setAtendimentos((current) => current.filter((atendimento) => atendimento.id !== id));
  }

  return (
    <main className="app-shell dashboard-page">
      <Sidebar />

      <section className="content-area">
        <Header onNovoAtendimento={() => setFormState({ open: true, editing: null })} />

        <section className="summary-grid" aria-label="Resumo dos atendimentos">
          <CardResumo
            icon={CalendarDays}
            label="Atendimentos do mês"
            value={String(resumo.quantidade)}
            helper="+20% em relação ao mês anterior"
            tone="blue"
          />
          <CardResumo
            icon={WalletCards}
            label="Total recebido no mês"
            value={formatCurrency(resumo.total)}
            helper="+18% em relação ao mês anterior"
            tone="green"
          />
          <CardResumo
            icon={FileText}
            label="Atendimentos que precisam de NF/Recibo"
            value={String(resumo.pendentesDoc)}
            tone="orange"
            action={
              <button className="inline-action" onClick={() => navigate('/dashboard')}>
                Ver lista completa
              </button>
            }
          />
        </section>

        <section className="data-card glass-panel">
          <div className="section-title-row">
            <h2>Últimos atendimentos</h2>
            <button className="inline-action">Ver todos</button>
          </div>
          <AtendimentoTable
            atendimentos={atendimentos}
            onEdit={(atendimento) => setFormState({ open: true, editing: atendimento })}
            onDelete={handleDelete}
          />
        </section>

        <section className="quick-card glass-panel">
          <h2>Resumo rápido do mês</h2>
          <div className="quick-grid">
            <div className="quick-item">
              <span className="quick-icon quick-blue">
                <Users size={22} />
              </span>
              <strong>{resumo.quantidade}</strong>
              <p>Atendimentos realizados</p>
            </div>
            <div className="quick-item">
              <span className="quick-icon quick-green">
                <WalletCards size={22} />
              </span>
              <strong>{formatCurrency(resumo.total)}</strong>
              <p>Total recebido</p>
            </div>
            <div className="quick-item">
              <span className="quick-icon quick-orange">
                <FileText size={22} />
              </span>
              <strong>{resumo.pendentesDoc}</strong>
              <p>Precisam de NF/Recibo</p>
            </div>
          </div>
        </section>
      </section>

      {formState.open ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel glass-panel" role="dialog" aria-modal="true">
            <div className="modal-heading">
              <h2>{formState.editing ? 'Editar atendimento' : 'Novo atendimento'}</h2>
              <p>Registre os dados necessários para controle fiscal e financeiro.</p>
            </div>
            <AtendimentoForm
              initialValues={formState.editing}
              onCancel={closeForm}
              onSubmit={handleSubmit}
            />
          </section>
        </div>
      ) : null}
    </main>
  );
}
