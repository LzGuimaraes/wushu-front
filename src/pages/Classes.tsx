import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  addStudentToClass,
  createClass,
  deleteClass,
  listClassStudents,
  removeStudentFromClass,
} from "../api";
import { Alert } from "../components/Alert";
import { Field, SelectField, TextareaField } from "../components/Field";
import type { Option } from "../components/Field";
import { PageHeader } from "../components/PageHeader";
import { useConfirm } from "../hooks/useConfirm";
import { useForm } from "../hooks/useForm";
import {
  useClasses,
  useEnrollments,
  useStudents,
  useUsers,
} from "../hooks/useReferenceData";
import type { StudentClass } from "../types";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/apiError";
import { byId, enrollmentLabel, userLabel } from "../utils/labels";
import { buildPayload } from "../utils/payload";
import type { Schema } from "../utils/validation";
import { maxLength, required, uuid } from "../utils/validation";

const initialValues = {
  instructorId: "",
  name: "",
  schedule: "",
  description: "",
};

const schema: Schema<typeof initialValues> = {
  instructorId: [required("Selecione o instrutor"), uuid()],
  name: [required("Informe o nome da turma"), maxLength(100)],
  schedule: [maxLength(60)],
  description: [maxLength(300)],
};

const enrollmentFormValues = { enrollmentId: "" };
const enrollmentFormSchema: Schema<typeof enrollmentFormValues> = {
  enrollmentId: [required("Selecione a matrícula"), uuid()],
};

export default function Classes() {
  const classes = useClasses();
  const users = useUsers();
  const enrollments = useEnrollments();
  const students = useStudents();

  const form = useForm(initialValues, schema);
  const addForm = useForm(enrollmentFormValues, enrollmentFormSchema);
  const { askConfirm, confirmDialog } = useConfirm();

  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [classStudents, setClassStudents] = useState<StudentClass[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const usersById = useMemo(() => byId(users.items), [users.items]);
  const studentsById = useMemo(() => byId(students.items), [students.items]);
  const enrollmentsById = useMemo(
    () => byId(enrollments.items),
    [enrollments.items],
  );

  const instructorOptions: Option[] = useMemo(
    () =>
      [...users.items]
        // Apenas administradores (e instrutores) podem ser responsáveis por
        // turmas — alunos (role STUDENT) não devem aparecer no seletor.
        .filter((user) => user.role === "ADMIN")
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((user) => ({
          value: user.id,
          label: userLabel(user),
        })),
    [users.items],
  );

  const enrollmentOptions: Option[] = useMemo(() => {
    const alreadyIn = new Set(classStudents.map((item) => item.enrollmentId));
    return enrollments.items
      .filter(
        (enrollment) =>
          enrollment.status !== "CANCELLED" && !alreadyIn.has(enrollment.id),
      )
      .map((enrollment) => ({
        value: enrollment.id,
        label: enrollmentLabel(enrollment, studentsById, usersById),
      }));
  }, [enrollments.items, classStudents, studentsById, usersById]);

  const selectedClass = selectedId
    ? classes.items.find((item) => item.id === selectedId)
    : null;

  const loadClassStudents = async (classId: string) => {
    try {
      const { data } = await listClassStudents(classId);
      setClassStudents(data);
    } catch (requestError) {
      setClassStudents([]);
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível carregar os alunos da turma.",
        ),
      );
    }
  };

  const selectClass = async (classId: string) => {
    setSelectedId(classId);
    setError("");
    setSuccess("");
    addForm.reset();
    await loadClassStudents(classId);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.validate()) return;

    setSaving(true);
    try {
      await createClass(
        buildPayload({
          instructorId: form.values.instructorId,
          name: form.values.name,
          schedule: form.values.schedule,
          description: form.values.description,
        }),
      );
      form.reset();
      setShowForm(false);
      setSuccess("Turma criada com sucesso.");
      classes.reload();
    } catch (requestError) {
      form.setFieldErrors(getApiFieldErrors(requestError));
      setError(
        getApiErrorMessage(requestError, "Não foi possível criar a turma.", {
          409: "Já existe uma turma com esses dados.",
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const addStudent = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedId || !addForm.validate()) return;

    try {
      await addStudentToClass(selectedId, addForm.values.enrollmentId);
      addForm.reset();
      setSuccess("Aluno adicionado à turma.");
      await loadClassStudents(selectedId);
    } catch (requestError) {
      addForm.setFieldErrors(getApiFieldErrors(requestError));
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível adicionar o aluno à turma.",
          {
            409: "Este aluno já está nesta turma.",
          },
        ),
      );
    }
  };

  const removeStudent = async (enrollmentId: string) => {
    if (!selectedId) return;
    setError("");
    setSuccess("");
    try {
      await removeStudentFromClass(selectedId, enrollmentId);
      setSuccess("Aluno removido da turma.");
      await loadClassStudents(selectedId);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível remover o aluno da turma.",
        ),
      );
    }
  };

  const removeClass = async (classId: string) => {
    const ok = await askConfirm(
      "Excluir esta turma? A ação não pode ser desfeita.",
      { confirmLabel: "Excluir" },
    );
    if (!ok) return;
    setError("");
    setSuccess("");
    try {
      await deleteClass(classId);
      if (selectedId === classId) {
        setSelectedId(null);
        setClassStudents([]);
      }
      setSuccess("Turma excluída.");
      classes.reload();
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Não foi possível excluir a turma.", {
          400: "Esta turma tem alunos ou chamadas vinculados e não pode ser excluída.",
          409: "Esta turma tem alunos ou chamadas vinculados e não pode ser excluída.",
        }),
      );
    }
  };

  return (
    <div>
      {confirmDialog}
      <PageHeader
        titulo="Turmas"
        subtitle="Turmas e alunos matriculados em cada uma."
        backTo="/admin"
        actions={
          <button
            className={showForm ? "btn btn--ghost" : "btn btn--red"}
            onClick={() => {
              setShowForm((visible) => !visible);
              setError("");
              setSuccess("");
            }}
          >
            {showForm ? "Fechar" : "Nova turma"}
          </button>
        }
      />

      {classes.error && <Alert>{classes.error}</Alert>}
      {users.error && <Alert>{users.error}</Alert>}
      {error && <Alert onDismiss={() => setError("")}>{error}</Alert>}
      {success && (
        <Alert type="success" onDismiss={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {showForm && (
        <form className="card form" onSubmit={submit} noValidate>
          <h2>Nova turma</h2>
          <div className="form-grid">
            <SelectField
              form={form}
              name="instructorId"
              label="Instrutor"
              required
              options={instructorOptions}
              placeholder={
                instructorOptions.length === 0
                  ? "Nenhum usuário disponível"
                  : "Selecione o instrutor"
              }
            />
            <Field
              form={form}
              name="name"
              label="Nome da turma"
              required
              maxLength={100}
              placeholder="Ex.: Sanda — adultos"
            />
            <Field
              form={form}
              name="schedule"
              label="Horário"
              maxLength={60}
              placeholder="Ex.: Seg e Qua, 20h30"
            />
            <TextareaField
              form={form}
              name="description"
              label="Descrição"
              wide
              maxLength={300}
              placeholder="Nível, faixa etária, observações da turma..."
            />
          </div>
          <div className="form-actions">
            <button className="btn btn--red" type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar turma"}
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
        <h2>Turmas cadastradas</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Turma</th>
                <th>Horário</th>
                <th>Instrutor</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {classes.items.map((classEntity) => (
                <tr
                  key={classEntity.id}
                  className={
                    selectedId === classEntity.id ? "is-selected" : undefined
                  }
                >
                  <td>{classEntity.name}</td>
                  <td>{classEntity.schedule ?? "—"}</td>
                  <td>
                    {usersById.get(classEntity.instructorId)?.name ?? "—"}
                  </td>
                  <td className="cell-actions">
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={() => selectClass(classEntity.id)}
                    >
                      Ver alunos
                    </button>
                    <button
                      className="btn btn--danger btn--sm"
                      onClick={() => removeClass(classEntity.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {classes.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="table-empty">
                    {classes.loading
                      ? "Carregando..."
                      : "Nenhuma turma cadastrada."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedClass && (
        <div className="card">
          <h2>Alunos de {selectedClass.name}</h2>
          <form className="form form--inline" onSubmit={addStudent} noValidate>
            <SelectField
              form={addForm}
              name="enrollmentId"
              label="Matrícula"
              required
              options={enrollmentOptions}
              placeholder={
                enrollmentOptions.length === 0
                  ? "Nenhuma matrícula disponível"
                  : "Selecione a matrícula"
              }
              hint={
                enrollmentOptions.length === 0
                  ? "Todas as matrículas ativas já estão nesta turma."
                  : undefined
              }
            />
            <button className="btn btn--red" type="submit">
              Adicionar
            </button>
          </form>

          <ul className="list">
            {classStudents.map((item) => {
              const enrollment = enrollmentsById.get(item.enrollmentId);
              return (
                <li key={item.id}>
                  <span>
                    {enrollment
                      ? enrollmentLabel(enrollment, studentsById, usersById)
                      : "Matrícula não encontrada"}
                  </span>
                  <button
                    className="btn btn--danger btn--sm"
                    onClick={() => removeStudent(item.enrollmentId)}
                  >
                    Remover
                  </button>
                </li>
              );
            })}
            {classStudents.length === 0 && (
              <li className="muted">Nenhum aluno nesta turma.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
