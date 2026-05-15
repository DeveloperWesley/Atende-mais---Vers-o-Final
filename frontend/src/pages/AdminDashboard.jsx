import { CheckCircle, Download, FileSpreadsheet, Search, Users, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import AtendimentoTable from '../components/AtendimentoTable.jsx';
import CardResumo from '../components/CardResumo.jsx';
import Input from '../components/Input.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const atendimentosAdmin = [
  { id: 1, data: '16/05/2024', paciente: 'Maria Oliveira', pagador: 'Maria Oliveira', valor: 'R$ 250,00', precisaDoc: true },
  { id: 2, data: '15/05/2024', paciente: 'João Souza',    pagador: 'João Souza',    valor: 'R$ 180,00', precisaDoc: false },
  { id: 3, data: '14/05/2024', paciente: 'Ana Paula Lima', pagador: 'Plano Saúde ABC', valor: 'R$ 300,00', precisaDoc: true },
  { id: 4, data: '13/05/2024', paciente: 'Carlos Eduardo', pagador: 'Carlos Eduardo', valor: 'R$ 150,00', precisaDoc: false }
];

const STATUS_LABEL = { ativo: 'Ativo', pendente: 'Pendente', inativo: 'Inativo' };
const STATUS_CLASS = { ativo: 'badge badge-active', pendente: 'badge badge-pending', inativo: 'badge badge-inactive' };

export default function AdminDashboard() {
  const { usuarios, aprovarUsuario, rejeitarUsuario } = useAuth();
  const [aba, setAba] = useState('atendimentos');
  const [busca, setBusca] = useState('');

  const profissionais = useMemo(() => usuarios.filter((u) => u.perfil === 'profissional'), [usuarios]);
  const pendentes = useMemo(() => profissionais.filter((u) => u.status === 'pendente'), [profissionais]);

  const usuariosFiltrados = useMemo(
    () => profissionais.filter((u) => u.nome.toLowerCase().includes(busca.toLowerCase())),
    [profissionais, busca]
  );

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="content-area">
        <header className="top-bar">
          <div className="top-bar-greeting">
            <h1>Área administrativa</h1>
            <p>Gerencie usuários e extraia dados para NF, Receita Saúde e IRPF.</p>
          </div>
          <div className="top-bar-actions">
            <button className="btn btn-ghost btn-md">
              <Download size={16} /> CSV
            </button>
            <button className="btn btn-secondary btn-md">
              <FileSpreadsheet size={16} /> Excel
            </button>
          </div>
        </header>

        <div className="main-content">
          {/* Summary */}
          <section className="summary-grid admin-summary" aria-label="Resumo administrativo">
            <CardResumo
              icon={Users}
              label="Profissionais ativos"
              value={String(profissionais.filter((u) => u.status === 'ativo').length)}
              helper="Com acesso liberado"
              tone="blue"
            />
            <CardResumo
              icon={FileSpreadsheet}
              label="Atendimentos"
              value="36"
              helper="Competência atual"
              tone="green"
            />
            <CardResumo
              icon={Users}
              label="Aguardando aprovação"
              value={String(pendentes.length)}
              helper="Novos cadastros"
              helperType="warning"
              tone="orange"
            />
          </section>

          {/* Tabs */}
          <div className="admin-tabs">
            <button className={`admin-tab${aba === 'atendimentos' ? ' active' : ''}`} onClick={() => setAba('atendimentos')}>
              Atendimentos
            </button>
            <button className={`admin-tab${aba === 'usuarios' ? ' active' : ''}`} onClick={() => setAba('usuarios')}>
              Usuários
              {pendentes.length > 0 && <span className="tab-count">{pendentes.length}</span>}
            </button>
          </div>

          {/* Atendimentos tab */}
          {aba === 'atendimentos' && (
            <>
              <section className="filters-card surface-card">
                <Input
                  label="Profissional, paciente ou pagador"
                  icon={Search}
                  placeholder="Buscar"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
                <Input label="Período inicial" type="date" />
                <Input label="Período final" type="date" />
                <Input label="Competência" placeholder="05/2024" />
              </section>

              <div className="admin-grid">
                <article className="data-card surface-card">
                  <div className="section-title-row">
                    <h2>Profissionais</h2>
                  </div>
                  <div className="professional-list">
                    {profissionais
                      .filter((u) => u.status === 'ativo' && u.nome.toLowerCase().includes(busca.toLowerCase()))
                      .map((u) => (
                        <button className="professional-row" key={u.id}>
                          <span>
                            <strong>{u.nome}</strong>
                            <small>{u.especialidade}</small>
                          </span>
                          <span style={{ textAlign: 'right' }}>
                            <strong>—</strong>
                            <small>Ver atendimentos</small>
                          </span>
                        </button>
                      ))}
                  </div>
                </article>

                <article className="data-card surface-card">
                  <div className="section-title-row">
                    <h2>Atendimentos</h2>
                    <button className="inline-action">Exportar</button>
                  </div>
                  <AtendimentoTable atendimentos={atendimentosAdmin} compact />
                </article>
              </div>
            </>
          )}

          {/* Usuários tab */}
          {aba === 'usuarios' && (
            <article className="data-card surface-card">
              <div className="section-title-row">
                <h2>Usuários cadastrados</h2>
                <div style={{ width: 220 }}>
                  <Input
                    placeholder="Buscar por nome…"
                    icon={Search}
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Especialidade</th>
                      <th>Cadastro</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.map((u) => (
                      <tr key={u.id}>
                        <td>{u.nome}</td>
                        <td>{u.email}</td>
                        <td>{u.especialidade || '—'}</td>
                        <td>{u.criadoEm}</td>
                        <td><span className={STATUS_CLASS[u.status]}>{STATUS_LABEL[u.status]}</span></td>
                        <td>
                          <div className="action-row">
                            {u.status !== 'ativo' && (
                              <button className="approve-btn" onClick={() => aprovarUsuario(u.id)}>
                                <CheckCircle size={13} /> Aprovar
                              </button>
                            )}
                            {u.status !== 'inativo' && (
                              <button className="reject-btn" onClick={() => rejeitarUsuario(u.id)}>
                                <XCircle size={13} /> {u.status === 'pendente' ? 'Rejeitar' : 'Desativar'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {usuariosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          Nenhum usuário encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
