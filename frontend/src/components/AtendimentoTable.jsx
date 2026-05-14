import { Pencil, Trash2 } from 'lucide-react';

export default function AtendimentoTable({ atendimentos, onDelete, onEdit, compact = false }) {
  return (
    <div className="table-wrap">
      <table className={compact ? 'atendimento-table compact-table' : 'atendimento-table'}>
        <thead>
          <tr>
            <th>Data</th>
            <th>Paciente</th>
            <th>Pagador</th>
            <th>Valor</th>
            <th>NF/Recibo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {atendimentos.map((atendimento) => (
            <tr key={atendimento.id}>
              <td>{atendimento.data}</td>
              <td>{atendimento.paciente}</td>
              <td>{atendimento.pagador}</td>
              <td>{atendimento.valor}</td>
              <td>
                <span className={`pill ${atendimento.precisaDoc ? 'pill-success' : 'pill-muted'}`}>
                  {atendimento.precisaDoc ? 'Sim' : 'Não'}
                </span>
              </td>
              <td>
                <div className="table-actions">
                  <button
                    className="icon-btn"
                    title="Editar atendimento"
                    aria-label="Editar atendimento"
                    onClick={() => onEdit?.(atendimento)}
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    className="icon-btn icon-btn-danger"
                    title="Excluir atendimento"
                    aria-label="Excluir atendimento"
                    onClick={() => onDelete?.(atendimento.id)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
