import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  confirmPayment,
  createPayment,
  deletePayment,
  listPayments,
} from "../api";
import { Alert } from "../components/Alert";
import { Field, SelectField, TextareaField } from "../components/Field";
import type { Option } from "../components/Field";
import { useForm } from "../hooks/useForm";
import {
  useEnrollments,
  useStudents,
  useUsers,
} from "../hooks/useReferenceData";
import type { Payment } from "../types";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/apiError";
import {
  currentMonthISO,
  formatCompetence,
  formatDate,
  formatMoney,
  maskAmount,
} from "../utils/format";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_LABELS,
  byId,
  enrollmentLabel,
} from "../utils/labels";
import { buildPayload } from "../utils/payload";
import type { Schema } from "../utils/validation";
import {
  date,
  maxLength,
  money,
  notBefore,
  required,
  uuid,
} from "../utils/validation";

const initialValues = {
  enrollmentId: "",
  amount: "",
  competence: currentMonthISO(),
  dueDate: "",
  paymentMethod: "PIX",
  notes: "",
};

const schema: Schema<typeof initialValues> = {
  enrollmentId: [required("Selecione a matrícula"), uuid()],
  amount: [required("Informe o valor"), money(0.01)],
  competence: [required("Informe a competência"), date()],
  dueDate: [
    required("Informe o vencimento"),
    date(),
    notBefore("competence", "O vencimento não pode ser anterior à competência"),
  ],
  paymentMethod: [required("Selecione a forma de pagamento")],
  notes: [maxLength(300)],
};

export default function Payments() {
  const enrollments = useEnrollments();
  const students = useStudents();
  const users = useUsers();
  const form = useForm(initialValues, schema);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const usersById = useMemo(() => byId(users.items), [users.items]);
  const studentsById = useMemo(() => byId(students.items), [students.items]);
  const enrollmentsById = useMemo(
    () => byId(enrollments.items),
    [enrollments.items],
  );

  const enrollmentOptions: Option[] = useMemo(
    () =>
      enrollments.items
        .filter((enrollment) => enrollment.status !== "CANCELLED")
        .map((enrollment) => ({
          value: enrollment.id,
          label: enrollmentLabel(enrollment, studentsById, usersById),
        })),
    [enrollments.items, studentsById, usersById],
  );

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await listPayments();
      setPayments(data);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível carregar os pagamentos.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.validate()) return;

    setSaving(true);
    try {
      await createPayment(
        buildPayload({
          enrollmentId: form.values.enrollmentId,
          amount: Number(form.values.amount.replace(",", ".")),
          // O input de mês envia "aaaa-mm"; a API espera uma data completa.
          competence: `${form.values.competence}-01`,
          dueDate: form.values.dueDate,
          paymentMethod: form.values.paymentMethod,
          notes: form.values.notes,
        }),
      );
      form.reset();
      setShowForm(false);
      setSuccess("Mensalidade lançada.");
      await load();
    } catch (requestError) {
      form.setFieldErrors(getApiFieldErrors(requestError));
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível lançar a mensalidade.",
          {
            409: "Já existe uma mensalidade desta matrícula para esta competência.",
          },
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const confirm = async (id: string) => {
    setError("");
    setSuccess("");
    try {
      await confirmPayment(id);
      setSuccess("Pagamento confirmado.");
      await load();
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível confirmar o pagamento.",
        ),
      );
    }
  };

  const remove = async (id: string) => {
    if (
      !window.confirm("Excluir este pagamento? A ação não pode ser desfeita.")
    )
      return;
    setError("");
    setSuccess("");
    try {
      await deletePayment(id);
      setSuccess("Pagamento excluído.");
      await load();
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível excluir o pagamento.",
        ),
      );
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Financeiro</p>
          <h1>Mensalidades</h1>
        </div>
        <button
          className={showForm ? "btn btn--ghost" : "btn btn--red"}
          onClick={() => {
            setShowForm((visible) => !visible);
            setError("");
            setSuccess("");
          }}
        >
          {showForm ? "Fechar" : "Nova mensalidade"}
        </button>
      </div>

      {enrollments.error && <Alert>{enrollments.error}</Alert>}
      {error && <Alert onDismiss={() => setError("")}>{error}</Alert>}
      {success && (
        <Alert type="success" onDismiss={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {showForm && (
        <form className="card form" onSubmit={submit} noValidate>
          <h2>Nova mensalidade</h2>
          <div className="form-grid">
            <SelectField
              form={form}
              name="enrollmentId"
              label="Matrícula"
              required
              wide
              options={enrollmentOptions}
              placeholder={
                enrollmentOptions.length === 0
                  ? "Nenhuma matrícula disponível"
                  : "Selecione a matrícula"
              }
              hint={
                enrollmentOptions.length === 0
                  ? "Crie a matrícula do aluno antes de lançar mensalidades."
                  : undefined
              }
            />
            <Field
              form={form}
              name="amount"
              label="Valor (R$)"
              required
              mask={maskAmount}
              inputMode="decimal"
              placeholder="180.00"
              hint="Use ponto para os centavos."
            />
            <Field
              form={form}
              name="competence"
              label="Competência"
              type="month"
              required
              hint="Mês de referência da mensalidade."
            />
            <Field
              form={form}
              name="dueDate"
              label="Vencimento"
              type="date"
              required
            />
            <SelectField
              form={form}
              name="paymentMethod"
              label="Forma de pagamento"
              required
              options={PAYMENT_METHOD_OPTIONS}
            />
            <TextareaField
              form={form}
              name="notes"
              label="Observações"
              wide
              maxLength={300}
            />
          </div>
          <div className="form-actions">
            <button className="btn btn--red" type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Lançar mensalidade"}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                form.reset();
                setShowForm(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="card">
        <h2>Mensalidades lançadas</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Competência</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Forma</th>
                <th>Situação</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const enrollment = enrollmentsById.get(payment.enrollmentId);
                return (
                  <tr key={payment.id}>
                    <td>
                      {enrollment
                        ? enrollmentLabel(enrollment, studentsById, usersById)
                        : "—"}
                    </td>
                    <td>{formatCompetence(payment.competence)}</td>
                    <td>{formatMoney(payment.amount)}</td>
                    <td>{formatDate(payment.dueDate)}</td>
                    <td>
                      {PAYMENT_METHOD_LABELS[payment.paymentMethod] ??
                        payment.paymentMethod}
                    </td>
                    <td>
                      <span
                        className={`badge badge-${payment.status.toLowerCase()}`}
                      >
                        {PAYMENT_STATUS_LABELS[payment.status] ??
                          payment.status}
                      </span>
                    </td>
                    <td className="cell-actions">
                      {payment.status !== "PAID" && (
                        <button
                          className="btn btn--gold btn--sm"
                          onClick={() => confirm(payment.id)}
                        >
                          Confirmar
                        </button>
                      )}
                      <button
                        className="btn btn--danger btn--sm"
                        onClick={() => remove(payment.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-empty">
                    {loading ? "Carregando..." : "Nenhuma mensalidade lançada."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
