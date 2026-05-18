export default function Input({
  error,
  icon: Icon,
  label,
  suffix,
  className = '',
  readOnly,
  ...props
}) {
  const shellClass = [
    'input-shell',
    error    ? 'input-error'    : '',
    readOnly ? 'input-readonly' : '',
  ].filter(Boolean).join(' ');

  return (
    <label className={`field ${className}`.trim()}>
      {label ? <span className="field-label">{label}</span> : null}
      <span className={shellClass}>
        {Icon ? <Icon size={18} strokeWidth={1.9} aria-hidden="true" /> : null}
        <input readOnly={readOnly} {...props} />
        {suffix ? <span className="input-suffix">{suffix}</span> : null}
      </span>
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
