import { Calendar, ChevronDown, Download, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

const TABS = ['Hoje', 'Semana', 'Mês', 'Personalizado'];

const NF_PILL = {
  emitido: { cls: 'pill pill-green',  label: 'Emitido' },
  pendente: { cls: 'pill pill-orange', label: 'Pendente' }
};

const RS_PILL = {
  pronto: { cls: 'pill pill-green', label: 'Pronto' },
  nao:    { cls: 'pill pill-red',   label: 'Não' }
};

function formatCPF(doc = '') {
  const d = doc.replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
  if (d.length === 14) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
  return doc;
}

export default function AtendimentoTable({ atendimentos, onDelete, onEdit, compact = false }) {
  const [activeTab, setActiveTab] = useState('Mês');

  if (compact) {
    return (
      <div className="table-wrap">
        <table className="atendimento-table">
          <thead>
            <tr>
              <th>Data</th><th>Paciente</th><th>Pagador</th><th>Valor</th><th>NF</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {atendimentos.map((a) => (
              <tr key={a.id}>
                <td className="table-cell-muted">{a.data}</td>
                <td>{a.paciente}</td>
                <td className="table-cell-muted">{a.pagador}</td>
                <td><strong>{a.valor}</strong></td>
                <td>
                  <span className={a.precisaDoc ? 'pill pill-orange' : 'pill pill-muted'}>
                    {a.precisaDoc ? 'Pendente' : 'OK'}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="icon-btn" onClick={() => onEdit?.(a)}><Pencil size={15} /></button>
                    <button className="icon-btn icon-btn-danger" onClick={() => onDelete?.(a.id)}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="data-card surface-card">

      {/* ── Título ─────────────────────────────── */}
      <div className="table-title-row">
        <h2>Últimos atendimentos</h2>
      </div>

      {/* ── Abas de filtro + Exportar ───────────── */}
      <div className="filter-tabs-row">
        <div className="filter-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`filter-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
          <button className="filter-tab-icon" title="Escolher data">
            <Calendar size={15} />
          </button>
        </div>

        <button className="export-csv-btn">
          <Download size={15} />
          Exportar CSV
        </button>
      </div>

      {/* ── Tabela ─────────────────────────────── */}
      <div className="table-wrap">
        <table className="atendimento-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Paciente</th>
              <th>Pagador</th>
              <th>CPF Paciente</th>
              <th>CPF/CNPJ Pagador</th>
              <th>Valor</th>
              <th>NF</th>
              <th>Receita Saúde</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {atendimentos.map((a) => {
              const nf = NF_PILL[a.nfStatus] || NF_PILL.pendente;
              const rs = RS_PILL[a.receitaSaude] || RS_PILL.pronto;
              return (
                <tr key={a.id}>
                  <td className="table-cell-muted">{a.data}</td>
                  <td>{a.paciente}</td>
                  <td className="table-cell-muted">{a.pagador}</td>
                  <td className="table-cell-muted">{formatCPF(a.cpfPaciente)}</td>
                  <td className="table-cell-muted">{formatCPF(a.cpfPagador)}</td>
                  <td><strong>{a.valor}</strong></td>
                  <td><span className={nf.cls}>{nf.label}</span></td>
                  <td><span className={rs.cls}>{rs.label}</span></td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-btn" onClick={() => onEdit?.(a)} title="Editar"><Pencil size={15} /></button>
                      <button className="icon-btn icon-btn-danger" onClick={() => onDelete?.(a.id)} title="Excluir"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Rodapé ─────────────────────────────── */}
      <div className="table-footer">
        <button className="see-all-link">
          Ver todos os atendimentos <ChevronDown size={15} />
        </button>
      </div>
    </div>
  );
}
