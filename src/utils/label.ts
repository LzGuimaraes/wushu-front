import type { Option } from "../components/Field";
import type { Enrollment, StudentProfile, User } from "../types";
import { formatCpf } from "./format";

export const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  ACTIVE: "Ativa",
  CANCELLED: "Cancelada",
  FINISHED: "Concluída",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  OVERDUE: "Vencido",
  CANCELLED: "Cancelado",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: "PIX",
  CASH: "Dinheiro",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
};

export const GOAL_LABELS: Record<string, string> = {
  FITNESS: "Condicionamento físico",
  COMPETITION: "Competição",
  SELF_DEFENSE: "Defesa pessoal",
  LEISURE: "Lazer",
  OTHER: "Outro",
};

export const GOAL_OPTIONS: Option[] = Object.entries(GOAL_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export const PAYMENT_METHOD_OPTIONS: Option[] = Object.entries(
  PAYMENT_METHOD_LABELS,
).map(([value, label]) => ({ value, label }));

/** Modalidades oferecidas pela escola (as mesmas da landing page). */
export const MODALITY_OPTIONS: Option[] = [
  { value: "Kung Fu Tradicional", label: "Kung Fu Tradicional" },
  { value: "Sanda", label: "Sanda" },
  { value: "Tai Chi Chuan", label: "Tai Chi Chuan" },
  { value: "Kung Fu Kids", label: "Kung Fu Kids" },
];

export const byId = <T extends { id: string }>(items: T[]): Map<string, T> =>
  new Map(items.map((item) => [item.id, item]));

export const userLabel = (user: User): string => `${user.name} — ${user.email}`;

export function studentLabel(
  profile: StudentProfile,
  usersById: Map<string, User>,
): string {
  const user = usersById.get(profile.userId);
  const cpf = formatCpf(profile.cpf);
  return user ? `${user.name} — CPF ${cpf}` : `CPF ${cpf}`;
}

export function enrollmentLabel(
  enrollment: Enrollment,
  studentsById: Map<string, StudentProfile>,
  usersById: Map<string, User>,
): string {
  const student = studentsById.get(enrollment.studentId);
  const name = student
    ? studentLabel(student, usersById)
    : "aluno não encontrado";
  const status =
    ENROLLMENT_STATUS_LABELS[enrollment.status] ?? enrollment.status;
  return `${enrollment.enrollmentNumber} · ${name} (${status})`;
}
