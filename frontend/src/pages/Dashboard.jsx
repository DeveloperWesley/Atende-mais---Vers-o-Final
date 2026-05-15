import { CalendarDays, CreditCard, FileText, UserCheck } from 'lucide-react';
import { useState } from 'react';
import AtendimentoForm from '../components/AtendimentoForm.jsx';
import AtendimentoTable from '../components/AtendimentoTable.jsx';
import CardResumo from '../components/CardResumo.jsx';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';

const mockAtendimentos = [
  {
    id: 1,
    data: '16/05/2024',
    paciente: 'Maria Oliveira',
    pagador: 'Maria Oliveira',
    cpfPaciente: '12345678901',
    cpfPagador: '12345678901',
    valor: 'R$ 250,00',
    nfStatus: 'pendente',
    receitaSaude: 'pronto',
    precisaDoc: true,
    dataAtendimento: '2024-05-16',
    pagadorNome: 'Maria Oliveira',
    pagadorDoc: '12345678901',
    pacienteMesmoPagador: true,
    pacienteNome: 'Maria Oliveira',
    pacienteCpf: '12345678901',
    observacoes: ''
  },
  {
    id: 2,
    data: '15/05/2024',
    paciente: 'João Souza',
    pagador: 'João Souza',
    cpfPaciente: '98765432100',
    cpfPagador: '98765432100',
    valor: 'R$ 180,00',
    nfStatus: 'emitido',
    receitaSaude: 'pronto',
    precisaDoc: false,
    dataAtendimento: '2024-05-15',
    pagadorNome: 'João Souza',
    pagadorDoc: '98765432100',
    pacienteMesmoPagador: true,
    pacienteNome: 'João Souza',
    pacienteCpf: '98765432100',
    observacoes: ''
  },
  {
    id: 3,
    data: '14/05/2024',
    paciente: 'Ana Paula Lima',
    pagador: 'Plano Saúde ABC',
    cpfPaciente: '11122233344',
    cpfPagador: '12345678000190',
    valor: 'R$ 300,00',
    nfStatus: 'pendente',
    receitaSaude: 'pronto',
    precisaDoc: true,
    dataAtendimento: '2024-05-14',
    pagadorNome: 'Plano Saúde ABC',
    pagadorDoc: '12345678000190',
    pacienteMesmoPagador: false,
    pacienteNome: 'Ana Paula Lima',
    pacienteCpf: '11122233344',
    observacoes: ''
  },
  {
    id: 4,
    data: '13/05/2024',
    paciente: 'Carlos Eduardo',
    pagador: 'Carlos Eduardo',
    cpfPaciente: '44455566677',
    cpfPagador: '44455566677',
    valor: 'R$ 150,00',
    nfStatus: 'emitido',
    receitaSaude: 'nao',
    precisaDoc: false,
    dataAtendimento: '2024-05-13',
    pagadorNome: 'Carlos Eduardo',
    pagadorDoc: '44455566677',
    pacienteMesmoPagador: true,
    pacienteNome: 'Carlos Eduardo',
    pacienteCpf: '44455566677',
    observacoes: ''
  },
  {
    id: 5,
    data: '10/05/2024',
    paciente: 'Juliana Martins',
    pagador: 'Juliana Martins',
    cpfPaciente: '88899900011',
    cpfPagador: '88899900011',
    valor: 'R$ 200,00',
    nfStatus: 'emitido',
    receitaSaude: 'pronto',
    precisaDoc: false,
    dataAtendimento: '2024-05-10',
    pagadorNome: 'Juliana Martins',
    pagadorDoc: '88899900011',
    pacienteMesmoPagador: true,
    pacienteNome: 'Juliana Martins',
    pacienteCpf: '88899900011',
    observacoes: ''
  }
];

function formatDate(value) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function parseCurrency(str = '') {
  return parseFloat(str.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
}

export default function Dashboard() {
  const [atendimentos, setAtendimentos] = useState(mockAtendimentos);
  const [formState, setFormState] = useState({ open: false, editing: null });

  const resumo = {
    quantidade: atendimentos.length,
    total: atendimentos.reduce((sum, a) => sum + parseCurrency(a.valor), 0),
    pendentesDoc: atendimentos.filter((a) => a.nfStatus === 'pendente').length,
    semCpf: atendimentos.filter((a) => !a.cpfPaciente).length,
    semPagador: atendimentos.filter((a) => !a.pagador).length,
  };

  function closeForm() { setFormState({ open: false, editing: null }); }

  function handleSubmit(payload) {
    const item = {
      id: formState.editing?.id || Date.now(),
      data: formatDate(payload.dataAtendimento),
      paciente: payload.pacienteNome,
      pagador: payload.pagadorNome,
      cpfPaciente: payload.pacienteCpf,
      cpfPagador: payload.pagadorDoc,
      valor: formatCurrency(Number(payload.valorRecebido?.replace(',', '.') || 0)),
      nfStatus: payload.precisaDoc ? 'pendente' : 'emitido',
      receitaSaude: 'pronto',
      precisaDoc: payload.precisaDoc,
      ...payload
    };

    setAtendimentos((curr) =>
      formState.editing
        ? curr.map((a) => (a.id === formState.editing.id ? item : a))
        : [item, ...curr]
    );
    closeForm();
  }

  function handleDelete(id) {
    setAtendimentos((curr) => curr.filter((a) => a.id !== id));
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="content-area">
        <Header onNovoAtendimento={() => setFormState({ open: true, editing: null })} />

        <div className="main-content">
          {/* Summary cards */}
          <section className="summary-grid" aria-label="Resumo">
            <CardResumo
              icon={CalendarDays}
              label="Atendimentos do mês"
              value={String(resumo.quantidade)}
              helper="+8 em relação ao mês anterior ↑"
              tone="blue"
            />
            <CardResumo
              icon={CreditCard}
              label="Total recebido"
              value={formatCurrency(resumo.total)}
              helper="+12% em relação ao mês anterior ↑"
              tone="green"
            />
            <CardResumo
              icon={FileText}
              label="Pendências fiscais"
              value={String(resumo.pendentesDoc)}
              helper="Precisam de atenção"
              helperType="warning"
              tone="orange"
              onAction={() => {}}
            />
          </section>

          {/* Table with filters */}
          <AtendimentoTable
            atendimentos={atendimentos}
            onEdit={(a) => setFormState({ open: true, editing: a })}
            onDelete={handleDelete}
          />

          {/* Pendências */}
          <section>
            <h2 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>
              Pendências que precisam de atenção
            </h2>
            <div className="pending-grid">
              <div className="pending-card surface-card">
                <div className="pending-icon pending-icon-orange">
                  <FileText size={22} />
                </div>
                <h3>{resumo.pendentesDoc}</h3>
                <p>Atendimentos sem NF/Recibo</p>
                <span className="pending-link">Emitir agora →</span>
              </div>

              <div className="pending-card surface-card">
                <div className="pending-icon pending-icon-pink">
                  <UserCheck size={22} />
                </div>
                <h3>{resumo.semCpf}</h3>
                <p>Atendimento sem CPF do paciente</p>
                <span className="pending-link">Verificar agora →</span>
              </div>

              <div className="pending-card surface-card">
                <div className="pending-icon pending-icon-muted">
                  <CreditCard size={22} />
                </div>
                <h3>{resumo.semPagador}</h3>
                <p>Atendimentos sem pagador</p>
                <span className="pending-link pending-link-ok">Tudo certo! ✓</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Modal */}
      {formState.open && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel surface-card" role="dialog" aria-modal="true">
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
      )}
    </div>
  );
}
