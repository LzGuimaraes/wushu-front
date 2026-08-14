/** Máscaras de digitação e formatadores de exibição (pt-BR). */

export const onlyDigits = (value: string): string => value.replace(/\D/g, "");

/** 000.000.000-00 */
export function maskCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  const blocks = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 9),
  ].filter(Boolean);
  const head = blocks.join(".");
  return digits.length > 9 ? `${head}-${digits.slice(9)}` : head;
}

/** (00) 0000-0000 e (00) 00000-0000 */
export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  const split = digits.length > 10 ? 5 : 4;
  if (rest.length <= split) return `(${ddd}) ${rest}`;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

/** 00000-000 */
export function maskCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
}

/** Valor monetário digitado: mantém apenas números e uma vírgula/ponto decimal. */
export function maskAmount(value: string): string {
  const cleaned = value.replace(",", ".").replace(/[^\d.]/g, "");
  const [integer, ...decimals] = cleaned.split(".");
  if (decimals.length === 0) return integer;
  return `${integer}.${decimals.join("").slice(0, 2)}`;
}

export const formatCpf = (value?: string | null): string =>
  value ? maskCpf(value) : "—";

export const formatPhone = (value?: string | null): string =>
  value ? maskPhone(value) : "—";

export const formatCep = (value?: string | null): string =>
  value ? maskCep(value) : "—";

/** ISO (yyyy-mm-dd) para dd/mm/aaaa, sem conversão de fuso. */
export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return "—";
  return `${day}/${month}/${year}`;
}

/** ISO (yyyy-mm-dd) para mm/aaaa. */
export function formatCompetence(value?: string | null): string {
  if (!value) return "—";
  const [year, month] = value.slice(0, 10).split("-");
  if (!year || !month) return "—";
  return `${month}/${year}`;
}

export function formatMoney(value: string | number): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Data de hoje em yyyy-mm-dd no fuso local (para limites de inputs de data). */
export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Mês atual em yyyy-mm (para inputs type="month"). */
export const currentMonthISO = (): string => todayISO().slice(0, 7);
