import { onlyDigits } from "./format";

/** Retorna a mensagem de erro do campo ou null quando o valor é válido. */
export type Validator = (
  value: string,
  values: Record<string, string>,
) => string | null;

export type Schema<T extends Record<string, string>> = Partial<
  Record<keyof T, Validator[]>
>;

export type Errors<T extends Record<string, string>> = Partial<
  Record<keyof T, string>
>;

const isBlank = (value: string): boolean => value.trim() === "";

/* ------------------------------------------------------------------ *
 * Validadores                                                         *
 * ------------------------------------------------------------------ */

export const required =
  (message = "Campo obrigatório"): Validator =>
  (value) =>
    isBlank(value) ? message : null;

export const email =
  (message = "Informe um e-mail válido (exemplo: nome@email.com)"): Validator =>
  (value) =>
    isBlank(value) || /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value.trim())
      ? null
      : message;

export const minLength =
  (length: number, message?: string): Validator =>
  (value) =>
    isBlank(value) || value.trim().length >= length
      ? null
      : (message ?? `Use pelo menos ${length} caracteres`);

export const maxLength =
  (length: number, message?: string): Validator =>
  (value) =>
    value.trim().length <= length
      ? null
      : (message ?? `Use no máximo ${length} caracteres`);

export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const checkDigit = (size: number): number => {
    let sum = 0;
    for (let i = 0; i < size; i++) sum += Number(digits[i]) * (size + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return (
    checkDigit(9) === Number(digits[9]) && checkDigit(10) === Number(digits[10])
  );
}

export const cpf =
  (message = "CPF inválido — confira os números digitados"): Validator =>
  (value) =>
    isBlank(value) || isValidCpf(value) ? null : message;

export const phone =
  (message = "Telefone inválido — use DDD + número"): Validator =>
  (value) => {
    if (isBlank(value)) return null;
    const digits = onlyDigits(value);
    return digits.length === 10 || digits.length === 11 ? null : message;
  };

export const cep =
  (message = "CEP inválido — precisa ter 8 dígitos"): Validator =>
  (value) =>
    isBlank(value) || onlyDigits(value).length === 8 ? null : message;

export const uuid =
  (message = "Identificador inválido"): Validator =>
  (value) =>
    isBlank(value) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value.trim(),
    )
      ? null
      : message;

/** Aceita yyyy-mm-dd (input date) e yyyy-mm (input month). */
export const date =
  (message = "Data inválida"): Validator =>
  (value) => {
    if (isBlank(value)) return null;
    const normalized = value.length === 7 ? `${value}-01` : value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return message;
    const parsed = new Date(`${normalized}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return message;
    return parsed.getFullYear() >= 1900
      ? null
      : "Informe uma data a partir de 1900";
  };

export const notFuture =
  (message = "A data não pode estar no futuro"): Validator =>
  (value) => {
    if (isBlank(value)) return null;
    const normalized = value.length === 7 ? `${value}-01` : value;
    const parsed = new Date(`${normalized}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return parsed.getTime() <= today.getTime() ? null : message;
  };

export const ageBetween =
  (min: number, max: number): Validator =>
  (value) => {
    if (isBlank(value)) return null;
    const birth = new Date(`${value}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()))
      age--;
    if (age < min) return `Idade mínima de ${min} anos`;
    if (age > max) return "Confira a data de nascimento";
    return null;
  };

export const money =
  (min = 0.01, message?: string): Validator =>
  (value) => {
    if (isBlank(value)) return null;
    if (!/^\d+([.,]\d{1,2})?$/.test(value.trim())) {
      return "Use apenas números, com até 2 casas decimais (ex.: 180.00)";
    }
    const amount = Number(value.replace(",", "."));
    if (!Number.isFinite(amount)) return "Informe um valor numérico";
    if (amount < min) {
      return (
        message ??
        `O valor deve ser maior ou igual a ${min.toFixed(2).replace(".", ",")}`
      );
    }
    return null;
  };

export const requiredWhen =
  (
    predicate: (values: Record<string, string>) => boolean,
    message: string,
  ): Validator =>
  (value, values) =>
    predicate(values) && isBlank(value) ? message : null;

/** true quando a data de nascimento informada indica menos de 18 anos. */
export function isUnderage(birthDate?: string): boolean {
  if (!birthDate || isBlank(birthDate)) return false;
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return false;
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 18);
  return birth.getTime() > limit.getTime();
}

export const sameAs =
  (field: string, message = "Os valores não conferem"): Validator =>
  (value, values) =>
    isBlank(value) || value === values[field] ? null : message;

/** Erro quando a data do campo é anterior à data de outro campo. */
export const notBefore =
  (field: string, message: string): Validator =>
  (value, values) => {
    const other = values[field];
    if (isBlank(value) || !other || isBlank(other)) return null;
    const normalize = (raw: string) => (raw.length === 7 ? `${raw}-01` : raw);
    return normalize(value) >= normalize(other) ? null : message;
  };

/* ------------------------------------------------------------------ *
 * Execução                                                            *
 * ------------------------------------------------------------------ */

export function validateValue(
  validators: Validator[] | undefined,
  value: string,
  values: Record<string, string>,
): string | null {
  if (!validators) return null;
  for (const validator of validators) {
    const error = validator(value ?? "", values);
    if (error) return error;
  }
  return null;
}

export function validateAll<T extends Record<string, string>>(
  values: T,
  schema: Schema<T>,
): Errors<T> {
  const errors: Errors<T> = {};
  for (const key of Object.keys(schema) as (keyof T)[]) {
    const error = validateValue(schema[key], values[key] ?? "", values);
    if (error) errors[key] = error;
  }
  return errors;
}
