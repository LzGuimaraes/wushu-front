import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { approveEnrollment, createEnrollment, deleteEnrollment } from "../api";
import { Alert } from "../components/Alert";
import { Field, SelectField, TextareaField } from "../components/Field";
import type { Option } from "../components/Field";
import { useForm } from "../hooks/useForm";
import {
  useEnrollments,
  useStudents,
  useUsers,
} from "../hooks/useReferenceData";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/apiError";
import { formatDate, todayISO } from "../utils/format";
import { ENROLLMENT_STATUS_LABELS, byId, studentLabel } from "../utils/labels";
import { buildPayload } from "../utils/payload";
import type { Schema } from "../utils/validation";
import {
  date,
  maxLength,
  notBefore,
  notFuture,
  required,
  uuid,
} from "../utils/validation";

const initialValues = {
  studentId: "",
  enrollmentNumber: "",
  registrationDate: "",
  startDate: "",
  notes: "",
};

const schema: Schema<typeof initialValues> = {
  studentId: [required("Selecione o aluno"), uuid()],
  enrollmentNumber: [required("Informe o número da matrícula"), maxLength(20)],
  registrationDate: [
    required("Informe a data de registro"),
    date(),
    notFuture("A data de registro não pode estar no futuro"),
  ],
  startDate: [
    date(),
    notBefore("registrationDate", "O início não pode ser antes do registro"),
  ],
  notes: [maxLength(500)],
};

export default function Enrollments() {
  const enrollments = useEnrollments();
  const students = useStudents();
  const users = useUsers();
  const form = useForm(initialValues, schema);

  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const usersById = useMemo(() => byId(users.items), [users.items]);
  const studentsById = useMemo(() => byId(students.items), [students.items]);

  const studentOptions: Option[] = useMemo(
    () =>
      students.items.map((student) => ({
        value: student.id,
        label: studentLabel(student, usersById),
      })),
    [students.items, usersById],
  );

  /** Sugere o próximo número no formato ANO-0001. */
  const suggestNumber = () => {
    const year = new Date().getFullYear();
    const prefix = `${year}-`;
    const used = enrollments.items
      .filter((enrollment) => enrollment.enrollmentNumber.startsWith(prefix))
      .map((enrollment) =>
        Number(enrollment.enrollmentNumber.slice(prefix.length)),
      )
      .filter((value) => Number.isFinite(value));
    const next = used.length > 0 ? Math.max(...used) + 1 : 1;
    return `${prefix}${String(next).padStart(4, "0")}`;
  };

  const openForm = () => {
    form.reset({
      enrollmentNumber: suggestNumber(),
      registrationDate: todayISO(),
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.validate()) return;

    setSaving(true);
    try {
      await createEnrollment(
        buildPayload({
          studentId: form.values.studentId,
          enrollmentNumber: form.values.enrollmentNumber,
          registrationDate: form.values.registrationDate,
          startDate: form.values.startDate,
          notes: form.values.notes,
        }),
      );
      form.reset();
      setShowForm(false);
      setSuccess("Matrícula criada. Ela fica pendente até ser aprovada.");
      enrollments.reload();
    } catch (requestError) {
      form.setFieldErrors(getApiFieldErrors(requestError));
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível criar a matrícula.",
          {
            409: "Já existe uma matrícula com este número.",
          },
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const approve = async (id: string) => {
    setError("");
    setSuccess("");
    try {
      await approveEnrollment(id);
      setSuccess("Matrícula aprovada.");
      enrollments.reload();
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível aprovar a matrícula.",
        ),
      );
    }
  };

  const remove = async (id: string) => {
    if (
      !window.confirm("Excluir esta matrícula? A ação não pode ser desfeita.")
    )
      return;
    setError("");
    setSuccess("");
    try {
      await deleteEnrollment(id);
      setSuccess("Matrícula excluída.");
      enrollments.reload();
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível excluir a matrícula.",
          {
            400: "Esta matrícula tem pagamentos ou presenças vinculados e não pode ser excluída.",
            409: "Esta matrícula tem pagamentos ou presenças vinculados e não pode ser excluída.",
          },
        ),
      );
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Secretaria</p>
          <h1>Matrículas</h1>
        </div>
        <button
          className={showForm ? "btn btn--ghost" : "btn btn--red"}
          onClick={() => (showForm ? setShowForm(false) : openForm())}
        >
          {showForm ? "Fechar" : "Nova matrícula"}
        </button>
      </div>

      {enrollments.error && <Alert>{enrollments.error}</Alert>}
      {students.error && <Alert>{students.error}</Alert>}
      {error && <Alert onDismiss={() => setError("")}>{error}</Alert>}
      {success && (
        <Alert type="success" onDismiss={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {showForm && (
        <form className="card form" onSubmit={submit} noValidate>
          <h2>Nova matrícula</h2>
          <div className="form-grid">
            <SelectField
              form={form}
              name="studentId"
              label="Aluno"
              required
              wide
              options={studentOptions}
              placeholder={
                studentOptions.length === 0
                  ? "Nenhum aluno cadastrado"
                  : "Selecione o aluno"
              }
              hint={
                studentOptions.length === 0
                  ? 'Cadastre o aluno em "Alunos" antes de criar a matrícula.'
                  : undefined
              }
            />
            <Field
              form={form}
              name="enrollmentNumber"
              label="Número da matrícula"
              required
              maxLength={20}
              hint="Sugerido automaticamente, mas você pode alterar."
            />
            <Field
              form={form}
              name="registrationDate"
              label="Data de registro"
              type="date"
              required
              max={todayISO()}
            />
            <Field
              form={form}
              name="startDate"
              label="Início das aulas"
              type="date"
            />
            <TextareaField
              form={form}
              name="notes"
              label="Observações"
              wide
              maxLength={500}
              placeholder="Combinados, descontos, informações da turma..."
            />
          </div>
          <div className="form-actions">
            <button className="btn btn--red" type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar matrícula"}
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
        <h2>Matrículas registradas</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Aluno</th>
                <th>Situação</th>
                <th>Registro</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {enrollments.items.map((enrollment) => {
                const student = studentsById.get(enrollment.studentId);
                return (
                  <tr key={enrollment.id}>
                    <td>{enrollment.enrollmentNumber}</td>
                    <td>{student ? studentLabel(student, usersById) : "—"}</td>
                    <td>
                      <span
                        className={`badge badge-${enrollment.status.toLowerCase()}`}
                      >
                        {ENROLLMENT_STATUS_LABELS[enrollment.status] ??
                          enrollment.status}
                      </span>
                    </td>
                    <td>{formatDate(enrollment.registrationDate)}</td>
                    <td className="cell-actions">
                      {enrollment.status === "PENDING" && (
                        <button
                          className="btn btn--gold btn--sm"
                          onClick={() => approve(enrollment.id)}
                        >
                          Aprovar
                        </button>
                      )}
                      <button
                        className="btn btn--danger btn--sm"
                        onClick={() => remove(enrollment.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
              {enrollments.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-empty">
                    {enrollments.loading
                      ? "Carregando..."
                      : "Nenhuma matrícula registrada."}
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
