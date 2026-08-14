import { useCallback, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { Errors, Schema } from "../utils/validation";
import { validateAll, validateValue } from "../utils/validation";

export type FormValues = Record<string, string>;

type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export interface FormApi<T extends FormValues = FormValues> {
  values: T;
  errors: Errors<T>;
  setValue: (name: keyof T & string, value: string) => void;
  handleChange: (
    name: keyof T & string,
    mask?: (value: string) => string,
  ) => (event: ChangeEvent<FieldElement>) => void;
  handleBlur: (name: keyof T & string) => () => void;
  /** Erro a exibir: só aparece depois do blur ou de uma tentativa de envio. */
  showError: (name: keyof T & string) => string | undefined;
  /** Valida tudo e marca o formulário como enviado. Retorna true se estiver válido. */
  validate: () => boolean;
  /** Aplica erros vindos da API nos campos correspondentes. */
  setFieldErrors: (fieldErrors: Record<string, string>) => void;
  reset: (values?: Partial<T>) => void;
  isValid: boolean;
}

/**
 * Formulário controlado com validação por campo.
 * O `schema` deve ser uma constante fora do componente (identidade estável).
 */
export function useForm<T extends FormValues>(
  initialValues: T,
  schema: Schema<T> = {},
): FormApi<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Errors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  // `reset` precisa de identidade estável para poder entrar em dependências de efeitos.
  const initialRef = useRef(initialValues);

  const runField = (name: keyof T & string, nextValues: T) =>
    validateValue(schema[name], nextValues[name] ?? "", nextValues);

  const setValue: FormApi<T>["setValue"] = (name, value) => {
    const next = { ...values, [name]: value } as T;
    setValues(next);
    setErrors((currentErrors) => {
      // Revalida em tempo real apenas o campo que já está mostrando erro.
      if (!currentErrors[name]) return currentErrors;
      const error = runField(name, next);
      const updated = { ...currentErrors };
      if (error) updated[name] = error;
      else delete updated[name];
      return updated;
    });
  };

  const handleChange: FormApi<T>["handleChange"] = (name, mask) => (event) => {
    const raw = event.target.value;
    setValue(name, mask ? mask(raw) : raw);
  };

  const handleBlur: FormApi<T>["handleBlur"] = (name) => () => {
    setTouched((current) => ({ ...current, [name]: true }));
    const error = runField(name, values);
    setErrors((currentErrors) => {
      const updated = { ...currentErrors };
      if (error) updated[name] = error;
      else delete updated[name];
      return updated;
    });
  };

  const showError: FormApi<T>["showError"] = (name) =>
    submitted || touched[name] ? errors[name] : undefined;

  const validate: FormApi<T>["validate"] = () => {
    setSubmitted(true);
    const nextErrors = validateAll(values, schema);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const setFieldErrors: FormApi<T>["setFieldErrors"] = (fieldErrors) => {
    const mapped: Errors<T> = {};
    for (const [key, message] of Object.entries(fieldErrors)) {
      if (key in values) mapped[key as keyof T] = message;
    }
    if (Object.keys(mapped).length === 0) return;
    setSubmitted(true);
    setErrors((current) => ({ ...current, ...mapped }));
  };

  const reset: FormApi<T>["reset"] = useCallback((next?: Partial<T>) => {
    setValues({ ...initialRef.current, ...next });
    setErrors({});
    setTouched({});
    setSubmitted(false);
  }, []);

  return {
    values,
    errors,
    setValue,
    handleChange,
    handleBlur,
    showError,
    validate,
    setFieldErrors,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
}
