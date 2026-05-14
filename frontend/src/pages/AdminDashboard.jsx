import { Download, FileSpreadsheet, Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import AtendimentoTable from '../components/AtendimentoTable.jsx';
import Button from '../components/Button.jsx';
import CardResumo from '../components/CardResumo.jsx';
import Input from '../components/Input.jsx';
import Sidebar from '../components/Sidebar.jsx';

const profissionais = [
  { id: 1, nome: 'Dr. João Silva', especialidade: 'Psicologia', total: 'R$ 3.250,00', atendimentos: 12 },
  { id: 2, nome: 'Dra. Camila Rocha', especialidade: 'Nutrição', total: 'R$ 2.480,00', atendimentos: 9 },
  { id: 3, nome: 'Dr. Rafael Martins', especialidade: 'Fisioterapia', total: 'R$ 4.100,00', atendimentos: 15 }
];

const atendimentosAdmin = [
  { id: 1, data: '24/05/2024', paciente: 'Maria Oliveira', pagador: 'Maria Oliveira', valor: 'R$ 250,00', precisaDoc: true },
  { id: 2, data: '23/05/2024', paciente: 'João Santos', pagador: 'João Santos', valor: 'R$ 180,00', precisaDoc: false },
  { id: 3, data: '22/05/2024', paciente: 'Ana Paula Souza', pagador: 'Ana Paula Souza', valor: 'R$ 300,00', precisaDoc: true },
  { id: 4, data: '21/05/2024', paciente: 'Carlos Lima', pagador: 'Empresa XYZ Ltda', valor: 'R$ 500,00', precisaDoc: true }
];

export default function AdminDashboard() {
  const [busca, setBusca] = useState('');
  const profissionaisFiltrados = useMemo(
    () => profissionais.filter((item) => item.nome.toLowerCase().includes(busca.toLowerCase())),
    [busca]
  );

  return (
    <main className="app-shell dashboard-page">
      <Sidebar />

      <section className="content-area">
        <header className="dashboard-header">
          <div>
            <h1>Área administrativa</h1>
            <p>Extração de dados para notas, Receita Saúde, IRPF e controle financeiro.</p>
          </div>
          <div className="header-actions">
            <Button icon={Download}>CSV</Button>
            <Button icon={FileSpreadsheet} variant="secondary">
              Excel
            </Button>
          </div>
        </header>

        <section className="summary-grid admin-summary" aria-label="Resumo administrativo">
          <CardResumo icon={Users} label="Profissionais" value="3" helper="Com registros ativos" tone="blue" />
          <CardResumo icon={FileSpreadsheet} label="Atendimentos" value="36" helper="Competência atual" tone="green" />
          <CardResumo icon={Download} label="Pendentes de documento" value="14" helper="Para NF/Recibo" tone="orange" />
        </section>

        <section className="filters-card glass-panel">
          <Input
            label="Profissional, paciente ou pagador"
            icon={Search}
            placeholder="Buscar"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
          <Input label="Período inicial" type="date" />
          <Input label="Período final" type="date" />
          <Input label="Competência" placeholder="05/2024" />
        </section>

        <section className="admin-grid">
          <article className="data-card glass-panel">
            <div className="section-title-row">
              <h2>Profissionais</h2>
              <button className="inline-action">Ver todos</button>
            </div>
            <div className="professional-list">
              {profissionaisFiltrados.map((profissional) => (
                <button className="professional-row" key={profissional.id}>
                  <span>
                    <strong>{profissional.nome}</strong>
                    <small>{profissional.especialidade}</small>
                  </span>
                  <span>
                    <strong>{profissional.total}</strong>
                    <small>{profissional.atendimentos} atendimentos</small>
                  </span>
                </button>
              ))}
            </div>
          </article>

          <article className="data-card glass-panel">
            <div className="section-title-row">
              <h2>Atendimentos</h2>
              <button className="inline-action">Exportar</button>
            </div>
            {/* TODO: substituir dados mockados */}
            <AtendimentoTable atendimentos={atendimentosAdmin} compact />
          </article>
        </section>
      </section>
    </main>
  );
}
