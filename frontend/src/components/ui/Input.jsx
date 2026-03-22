import './Input.css'

export default function Input({
  label,
  error,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      {label && <label className="field__label">{label}</label>}
      <div className="field__wrap">
        {Icon && <Icon className="field__icon" size={16} />}
        <input className={`field__input ${Icon ? 'field__input--icon' : ''}`} {...props} />
      </div>
      {error && <p className="field__error">{error}</p>}
    </div>
  )
}
