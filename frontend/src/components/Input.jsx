export default function Input({
  error,
  icon: Icon,
  label,
  suffix,
  className = '',
  ...props
}) {
  return (
    <label className={`field ${className}`.trim()}>
      {label ? <span className="field-label">{label}</span> : null}
      <span className={`input-shell ${error ? 'input-error' : ''}`}>
        {Icon ? <Icon size={18} strokeWidth={1.9} aria-hidden="true" /> : null}
        <input {...props} />
        {suffix ? <span className="input-suffix">{suffix}</span> : null}
      </span>
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
