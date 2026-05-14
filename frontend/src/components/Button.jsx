export default function Button({
  children,
  className = '',
  icon: Icon,
  size = 'md',
  variant = 'primary',
  ...props
}) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`.trim()} {...props}>
      {Icon ? <Icon size={18} strokeWidth={2.2} aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}
