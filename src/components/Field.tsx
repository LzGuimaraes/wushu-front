import { useId, useState } from "react";
import type { ReactNode } from "react";
import type { FormApi, FormValues } from "../hooks/useForm";

export interface Option {
  value: string;
  label: string;
}

interface CommonProps<T extends FormValues> {
  form: FormApi<T>;
  name: keyof T & string;
  label: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  /** Ocupa a linha inteira dentro de .form-grid */
  wide?: boolean;
}

interface ShellProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}

function FieldShell({
  id,
  label,
  required,
  hint,
  error,
  wide,
  children,
}: ShellProps) {
  const classes = ["field"];
  if (wide) classes.push("field--wide");
  if (error) classes.push("field--invalid");

  return (
    <div className={classes.join(" ")}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required && (
          <span className="field__required" title="Campo obrigatório">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const describedBy = (
  id: string,
  error?: string,
  hint?: string,
): string | undefined => {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
};

interface FieldProps<T extends FormValues> extends CommonProps<T> {
  type?: "text" | "email" | "password" | "date" | "month" | "number" | "tel";
  placeholder?: string;
  mask?: (value: string) => string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
  maxLength?: number;
  autoComplete?: string;
  min?: string;
  max?: string;
  step?: string;
}

export function Field<T extends FormValues>({
  form,
  name,
  label,
  hint,
  required,
  disabled,
  wide,
  type = "text",
  placeholder,
  mask,
  inputMode,
  maxLength,
  autoComplete,
  min,
  max,
  step,
}: FieldProps<T>) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const error = form.showError(name);
  const isPassword = type === "password";
  const inputType = isPassword && revealed ? "text" : type;

  const input = (
    <input
      id={id}
      className="input"
      type={inputType}
      value={form.values[name] ?? ""}
      onChange={form.handleChange(name, mask)}
      onBlur={form.handleBlur(name)}
      placeholder={placeholder}
      inputMode={inputMode}
      maxLength={maxLength}
      autoComplete={autoComplete}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, error, hint)}
    />
  );

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
      wide={wide}
    >
      {isPassword ? (
        <div className="input-group">
          {input}
          <button
            type="button"
            className="input-group__action"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? "Ocultar senha" : "Mostrar senha"}
          >
            {revealed ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      ) : (
        input
      )}
    </FieldShell>
  );
}

interface SelectFieldProps<T extends FormValues> extends CommonProps<T> {
  options: Option[];
  placeholder?: string;
}

export function SelectField<T extends FormValues>({
  form,
  name,
  label,
  hint,
  required,
  disabled,
  wide,
  options,
  placeholder,
}: SelectFieldProps<T>) {
  const id = useId();
  const error = form.showError(name);

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
      wide={wide}
    >
      <select
        id={id}
        className="input"
        value={form.values[name] ?? ""}
        onChange={form.handleChange(name)}
        onBlur={form.handleBlur(name)}
        disabled={disabled || options.length === 0}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

interface TextareaFieldProps<T extends FormValues> extends CommonProps<T> {
  rows?: number;
  placeholder?: string;
  maxLength?: number;
}

export function TextareaField<T extends FormValues>({
  form,
  name,
  label,
  hint,
  required,
  disabled,
  wide,
  rows = 3,
  placeholder,
  maxLength,
}: TextareaFieldProps<T>) {
  const id = useId();
  const error = form.showError(name);

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
      wide={wide}
    >
      <textarea
        id={id}
        className="input"
        rows={rows}
        value={form.values[name] ?? ""}
        onChange={form.handleChange(name)}
        onBlur={form.handleBlur(name)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
      />
    </FieldShell>
  );
}
