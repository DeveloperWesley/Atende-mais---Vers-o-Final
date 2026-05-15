import { ChevronRight, TrendingUp } from 'lucide-react';

export default function CardResumo({ icon: Icon, label, value, helper, tone = 'blue', helperType = 'trend', onAction }) {
  return (
    <article className="summary-card surface-card">
      <div className={`summary-icon summary-icon-${tone}`}>
        <Icon size={24} strokeWidth={2} aria-hidden="true" />
      </div>

      <div className="summary-content">
        <p>{label}</p>
        <strong>{value}</strong>

        {helper && helperType === 'trend' && (
          <div className="summary-trend">
            <TrendingUp size={13} />
            {helper}
          </div>
        )}

        {helper && helperType === 'warning' && (
          <div className="summary-trend summary-trend-warning">{helper}</div>
        )}
      </div>

      {onAction && (
        <button className="summary-arrow" onClick={onAction} aria-label="Ver detalhes">
          <ChevronRight size={16} />
        </button>
      )}
    </article>
  );
}
