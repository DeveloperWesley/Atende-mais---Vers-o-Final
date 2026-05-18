import { Trash2 } from 'lucide-react';

export default function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="confirm-dialog surface-card" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon">
          <Trash2 size={22} />
        </div>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-sm confirm-btn-danger" onClick={onConfirm}>Excluir</button>
        </div>
      </div>
    </div>
  );
}
