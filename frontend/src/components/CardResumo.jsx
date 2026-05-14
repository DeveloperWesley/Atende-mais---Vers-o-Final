export default function CardResumo({
  icon: Icon,
  label,
  value,
  helper,
  tone = 'blue',
  action
}) {
  return (
    <article className="summary-card glass-panel">
      <div className={`summary-icon summary-icon-${tone}`}>
        <Icon size={24} strokeWidth={2} aria-hidden="true" />
      </div>
      <div className="summary-content">
        <p>{label}</p>
        <strong>{value}</strong>
        {helper ? <span>{helper}</span> : null}
        {action ? action : null}
      </div>
    </article>
  );
}
