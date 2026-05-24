/**
 * Поле auth-формы: видимая подпись + нативный input (паттерн mq-field).
 * telegram-ui Input header в TMA часто не читается — не используем здесь.
 */
export function AuthFormField({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  hint,
  autoComplete,
  inputMode,
  required = false,
  minLength,
  placeholder,
}) {
  const inputId = id || name;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint && !error ? `${inputId}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <label className={`mq-field${error ? ' mq-field--invalid' : ''}`} htmlFor={inputId}>
      <span className="mq-field__label">{label}</span>
      <input
        id={inputId}
        name={name}
        className="mq-field__input"
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {hint && !error ? (
        <span id={hintId} className="mq-field__hint">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="mq-field__error" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
