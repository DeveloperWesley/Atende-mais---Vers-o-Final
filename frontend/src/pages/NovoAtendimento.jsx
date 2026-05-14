import { useNavigate } from 'react-router-dom';
import AtendimentoForm from '../components/AtendimentoForm.jsx';
import Sidebar from '../components/Sidebar.jsx';

export default function NovoAtendimento() {
  const navigate = useNavigate();

  function handleSubmit() {
    // TODO: integrar com API real
    navigate('/dashboard');
  }

  return (
    <main className="app-shell dashboard-page">
      <Sidebar />
      <section className="content-area">
        <header className="dashboard-header">
          <div>
            <h1>Novo atendimento</h1>
            <p>Cadastre um atendimento com os dados fiscais essenciais.</p>
          </div>
        </header>

        <section className="form-page-card glass-panel">
          <AtendimentoForm onCancel={() => navigate('/dashboard')} onSubmit={handleSubmit} />
        </section>
      </section>
    </main>
  );
}
