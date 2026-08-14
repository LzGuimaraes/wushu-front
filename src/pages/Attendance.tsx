import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  createAttendance,
  deleteAttendance,
  listAttendanceByClass,
  listClassStudents,
  updateAttendance,
} from "../api";
import { Alert } from "../components/Alert";
import { Field, SelectField } from "../components/Field";
import type { Option } from "../components/Field";
import { useForm } from "../hooks/useForm";
import {
  useClasses,
  useEnrollments,
  useStudents,
  useUsers,
} from "../hooks/useReferenceData";
import type { Attendance } from "../types";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/apiError";
import { formatDate, todayISO } from "../utils/format";
import { byId, enrollmentLabel } from "../utils/labels";
import type { Schema } from "../utils/validation";
import { date, notFuture, required, uuid } from "../utils/validation";

const initialValues = {
  classId: "",
  enrollmentId: "",
  attendanceDate: todayISO(),
  present: "true",
};

const schema: Schema<typeof initialValues> = {
  classId: [required("Selecione a turma"), uuid()],
  enrollmentId: [required("Selecione o aluno"), uuid()],
  attendanceDate: [
    required("Informe a data da chamada"),
    date(),
    notFuture("Não é possível registrar chamada em data futura"),
  ],
  present: [required("Informe a presença")],
};

const PRESENCE_OPTIONS: Option[] = [
  { value: "true", label: "Presente" },
  { value: "false", label: "Ausente" },
];

export default function AttendancePage() {
  const classes = useClasses();
  const enrollments = useEnrollments();
  const students = useStudents();
  const users = useUsers();
  const form = useForm(initialValues, schema);

  const [filterClassId, setFilterClassId] = useState("");
  const [records, setRecords] = useState<Attendance[]>([]);
  const [classEnrollmentIds, setClassEnrollmentIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const usersById = useMemo(() => byId(users.items), [users.items]);
  const studentsById = useMemo(() => byId(students.items), [students.items]);
  const enrollmentsById = useMemo(
    () => byId(enrollments.items),
    [enrollments.items],
  );

  const classOptions: Option[] = useMemo(
    () => classes.items.map((item) => ({ value: item.id, label: item.name })),
    [classes.items],
  );

  const describeEnrollment = (enrollmentId: string): string => {
    const enrollment = enrollmentsById.get(enrollmentId);
    return enrollment
      ? enrollmentLabel(enrollment, studentsById, usersById)
      : "Matrícula não encontrada";
  };

  /** Só os alunos da turma selecionada podem receber chamada. */
  const selectedClassId = form.values.classId;
  useEffect(() => {
    if (!selectedClassId) {
      setClassEnrollmentIds([]);
      return;
    }
    let active = true;
    listClassStudents(selectedClassId)
      .then((response) => {
        if (active)
          setClassEnrollmentIds(response.data.map((item) => item.enrollmentId));
      })
      .catch(() => {
        if (active) setClassEnrollmentIds([]);
      });
    return () => {
      active = false;
    };
  }, [selectedClassId]);

  const enrollmentOptions: Option[] = useMemo(
    () =>
      classEnrollmentIds.map((enrollmentId) => {
        const enrollment = enrollmentsById.get(enrollmentId);
        return {
          value: enrollmentId,
          label: enrollment
            ? enrollmentLabel(enrollment, studentsById, usersById)
            : "Matrícula não encontrada",
        };
      }),
    [classEnrollmentIds, enrollmentsById, studentsById, usersById],
  );

  const loadRecords = async (classId: string) => {
    if (!classId) {
      setRecords([]);
      return;
    }
    setLoadingList(true);
    try {
      const { data } = await listAttendanceByClass(classId);
      setRecords(data);
    } catch (requestError) {
      setRecords([]);
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível carregar a chamada da turma.",
        ),
      );
    } finally {
      setLoadingList(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.validate()) return;

    setSaving(true);
    try {
      await createAttendance({
        enrollmentId: form.values.enrollmentId,
        classId: form.values.classId,
        attendanceDate: form.values.attendanceDate,
        present: form.values.present === "true",
      });
      setSuccess("Presença registrada.");
      form.reset({
        classId: form.values.classId,
        attendanceDate: form.values.attendanceDate,
      });
      setFilterClassId(form.values.classId);
      await loadRecords(form.values.classId);
    } catch (requestError) {
      form.setFieldErrors(getApiFieldErrors(requestError));
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível registrar a presença.",
          {
            409: "Este aluno já tem chamada registrada nesta turma e data.",
          },
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (record: Attendance) => {
    setError("");
    setSuccess("");
    try {
      await updateAttendance(record.id, { present: !record.present });
      await loadRecords(filterClassId);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível atualizar a presença.",
        ),
      );
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Excluir este registro de chamada?")) return;
    setError("");
    setSuccess("");
    try {
      await deleteAttendance(id);
      setSuccess("Registro excluído.");
      await loadRecords(filterClassId);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível excluir o registro.",
        ),
      );
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Tatame</p>
          <h1>Frequência</h1>
        </div>
      </div>

      {classes.error && <Alert>{classes.error}</Alert>}
      {error && <Alert onDismiss={() => setError("")}>{error}</Alert>}
      {success && (
        <Alert type="success" onDismiss={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <form className="card form" onSubmit={submit} noValidate>
        <h2>Registrar presença</h2>
        <div className="form-grid">
          <SelectField
            form={form}
            name="classId"
            label="Turma"
            required
            options={classOptions}
            placeholder={
              classOptions.length === 0
                ? "Nenhuma turma cadastrada"
                : "Selecione a turma"
            }
          />
          <SelectField
            form={form}
            name="enrollmentId"
            label="Aluno"
            required
            options={enrollmentOptions}
            placeholder={
              !form.values.classId
                ? "Selecione a turma primeiro"
                : enrollmentOptions.length === 0
                  ? "Nenhum aluno nesta turma"
                  : "Selecione o aluno"
            }
            hint={
              form.values.classId && enrollmentOptions.length === 0
                ? 'Adicione alunos a esta turma na página "Turmas".'
                : undefined
            }
          />
          <Field
            form={form}
            name="attendanceDate"
            label="Data"
            type="date"
            required
            max={todayISO()}
          />
          <SelectField
            form={form}
            name="present"
            label="Presença"
            required
            options={PRESENCE_OPTIONS}
          />
        </div>
        <div className="form-actions">
          <button className="btn btn--red" type="submit" disabled={saving}>
            {saving ? "Registrando..." : "Registrar presença"}
          </button>
        </div>
      </form>

      <div className="card">
        <div className="table-head">
          <h2>Chamada por turma</h2>
          <select
            className="input input--search"
            value={filterClassId}
            aria-label="Filtrar chamada por turma"
            onChange={(event) => {
              setFilterClassId(event.target.value);
              void loadRecords(event.target.value);
            }}
          >
            <option value="">Selecione uma turma</option>
            {classes.items.map((classEntity) => (
              <option key={classEntity.id} value={classEntity.id}>
                {classEntity.name}
              </option>
            ))}
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Aluno</th>
                <th>Presença</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{formatDate(record.attendanceDate)}</td>
                  <td>{describeEnrollment(record.enrollmentId)}</td>
                  <td>
                    <span
                      className={`badge ${record.present ? "badge-paid" : "badge-cancelled"}`}
                    >
                      {record.present ? "Presente" : "Ausente"}
                    </span>
                  </td>
                  <td className="cell-actions">
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={() => toggle(record)}
                    >
                      Alternar
                    </button>
                    <button
                      className="btn btn--danger btn--sm"
                      onClick={() => remove(record.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={4} className="table-empty">
                    {loadingList
                      ? "Carregando..."
                      : filterClassId
                        ? "Nenhuma chamada registrada para esta turma."
                        : "Selecione uma turma para ver a chamada."}
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
