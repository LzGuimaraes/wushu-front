import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { createStudent, deleteStudent } from "../api";
import { Alert } from "../components/Alert";
import { Field, SelectField } from "../components/Field";
import type { Option } from "../components/Field";
import { useForm } from "../hooks/useForm";
import { useStudents, useUsers } from "../hooks/useReferenceData";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/apiError";
import {
  formatCpf,
  formatPhone,
  maskCep,
  maskCpf,
  maskPhone,
  onlyDigits,
  todayISO,
} from "../utils/format";
import {
  GOAL_LABELS,
  GOAL_OPTIONS,
  MODALITY_OPTIONS,
  byId,
  userLabel,
} from "../utils/labels";
import { buildPayload } from "../utils/payload";
import type { Schema } from "../utils/validation";
import {
  ageBetween,
  cep,
  cpf,
  date,
  maxLength,
  notFuture,
  phone,
  required,
  requiredWhen,
  isUnderage,
  uuid,
} from "../utils/validation";

const initialValues = {
  userId: "",
  cpf: "",
  phone: "",
  responsiblePhone: "",
  birthDate: "",
  address: "",
  district: "",
  city: "Cuiabá",
  zipCode: "",
  trainingModality: "",
  goal: "FITNESS",
  belt: "",
  emergencyContact: "",
};

const schema: Schema<typeof initialValues> = {
  userId: [required("Selecione o usuário do aluno"), uuid()],
  cpf: [required("Informe o CPF"), cpf()],
  phone: [required("Informe o telefone"), phone()],
  responsiblePhone: [
    requiredWhen(
      (values) => isUnderage(values.birthDate),
      "Obrigatório para alunos menores de 18 anos",
    ),
    phone(),
  ],
  birthDate: [
    date(),
    notFuture("A data de nascimento não pode estar no futuro"),
    ageBetween(3, 100),
  ],
  address: [required("Informe o endereço"), maxLength(120)],
  district: [required("Informe o bairro"), maxLength(60)],
  city: [required("Informe a cidade"), maxLength(60)],
  zipCode: [required("Informe o CEP"), cep()],
  trainingModality: [required("Selecione a modalidade")],
  goal: [required("Selecione o objetivo")],
  belt: [maxLength(30)],
  emergencyContact: [maxLength(80)],
};

export default function Students() {
  const students = useStudents();
  const users = useUsers();
  const form = useForm(initialValues, schema);

  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const usersById = useMemo(() => byId(users.items), [users.items]);

  /** Só usuários que ainda não têm ficha de aluno podem ser vinculados. */
  const userOptions: Option[] = useMemo(() => {
    const taken = new Set(students.items.map((student) => student.userId));
    return users.items
      .filter((user) => !taken.has(user.id))
      .map((user) => ({ value: user.id, label: userLabel(user) }));
  }, [users.items, students.items]);

  const visibleStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students.items;
    const digits = onlyDigits(term);
    return students.items.filter((student) => {
      const name = usersById.get(student.userId)?.name?.toLowerCase() ?? "";
      return (
        name.includes(term) ||
        (digits.length > 0 && onlyDigits(student.cpf).includes(digits)) ||
        student.trainingModality.toLowerCase().includes(term)
      );
    });
  }, [students.items, usersById, search]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.validate()) return;

    setSaving(true);
    try {
      await createStudent(
        buildPayload({
          userId: form.values.userId,
          cpf: onlyDigits(form.values.cpf),
          phone: onlyDigits(form.values.phone),
          responsiblePhone: onlyDigits(form.values.responsiblePhone),
          birthDate: form.values.birthDate,
          address: form.values.address,
          district: form.values.district,
          city: form.values.city,
          zipCode: onlyDigits(form.values.zipCode),
          trainingModality: form.values.trainingModality,
          goal: form.values.goal,
          belt: form.values.belt,
          emergencyContact: form.values.emergencyContact,
        }),
      );
      form.reset();
      setShowForm(false);
      setSuccess("Aluno cadastrado com sucesso.");
      students.reload();
    } catch (requestError) {
      form.setFieldErrors(getApiFieldErrors(requestError));
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível cadastrar o aluno.",
          {
            409: "Já existe um aluno com este CPF ou vinculado a este usuário.",
          },
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Excluir este aluno? A ação não pode ser desfeita."))
      return;
    setError("");
    setSuccess("");
    try {
      await deleteStudent(id);
      setSuccess("Aluno excluído.");
      students.reload();
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Não foi possível excluir o aluno.", {
          409: "Este aluno tem matrículas vinculadas e não pode ser excluído.",
          400: "Este aluno tem registros vinculados e não pode ser excluído.",
        }),
      );
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Cadastro</p>
          <h1>Alunos</h1>
        </div>
        <button
          className={showForm ? "btn btn--ghost" : "btn btn--red"}
          onClick={() => {
            setShowForm((visible) => !visible);
            setError("");
            setSuccess("");
          }}
        >
          {showForm ? "Fechar" : "Novo aluno"}
        </button>
      </div>

      {students.error && <Alert>{students.error}</Alert>}
      {users.error && <Alert>{users.error}</Alert>}
      {error && <Alert onDismiss={() => setError("")}>{error}</Alert>}
      {success && (
        <Alert type="success" onDismiss={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {showForm && (
        <form className="card form" onSubmit={submit} noValidate>
          <h2>Novo aluno</h2>
          <p className="form__note">
            Campos marcados com <span className="field__required">*</span> são
            obrigatórios.
          </p>

          <div className="form-grid">
            <SelectField
              form={form}
              name="userId"
              label="Usuário da conta"
              required
              wide
              options={userOptions}
              placeholder={
                userOptions.length === 0
                  ? "Nenhum usuário disponível"
                  : "Selecione o usuário"
              }
              hint={
                userOptions.length === 0
                  ? "Todos os usuários já possuem ficha de aluno. Peça para o aluno criar a conta primeiro."
                  : "O aluno precisa ter criado a conta antes da ficha."
              }
            />
            <Field
              form={form}
              name="cpf"
              label="CPF"
              required
              mask={maskCpf}
              inputMode="numeric"
              placeholder="000.000.000-00"
            />
            <Field
              form={form}
              name="birthDate"
              label="Data de nascimento"
              type="date"
              max={todayISO()}
            />
            <Field
              form={form}
              name="phone"
              label="Telefone"
              required
              mask={maskPhone}
              inputMode="tel"
              placeholder="(65) 90000-0000"
            />
            <Field
              form={form}
              name="responsiblePhone"
              label="Telefone do responsável"
              mask={maskPhone}
              inputMode="tel"
              placeholder="(65) 90000-0000"
              hint={
                isUnderage(form.values.birthDate)
                  ? "Obrigatório: o aluno é menor de idade."
                  : undefined
              }
            />
            <Field
              form={form}
              name="zipCode"
              label="CEP"
              required
              mask={maskCep}
              inputMode="numeric"
              placeholder="78000-000"
            />
            <Field form={form} name="address" label="Endereço" required wide />
            <Field form={form} name="district" label="Bairro" required />
            <Field form={form} name="city" label="Cidade" required />
            <SelectField
              form={form}
              name="trainingModality"
              label="Modalidade"
              required
              options={MODALITY_OPTIONS}
              placeholder="Selecione a modalidade"
            />
            <SelectField
              form={form}
              name="goal"
              label="Objetivo"
              required
              options={GOAL_OPTIONS}
            />
            <Field
              form={form}
              name="belt"
              label="Faixa"
              placeholder="Ex.: preta 1º grau"
            />
            <Field
              form={form}
              name="emergencyContact"
              label="Contato de emergência"
              placeholder="Nome e telefone"
            />
          </div>

          <div className="form-actions">
            <button className="btn btn--red" type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar aluno"}
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
        <div className="table-head">
          <h2>Alunos cadastrados</h2>
          <input
            className="input input--search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, CPF ou modalidade"
            aria-label="Buscar alunos"
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Aluno</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>Modalidade</th>
                <th>Objetivo</th>
                <th>Faixa</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {visibleStudents.map((student) => (
                <tr key={student.id}>
                  <td>{usersById.get(student.userId)?.name ?? "—"}</td>
                  <td>{formatCpf(student.cpf)}</td>
                  <td>{formatPhone(student.phone)}</td>
                  <td>{student.trainingModality}</td>
                  <td>{GOAL_LABELS[student.goal] ?? student.goal}</td>
                  <td>{student.belt ?? "—"}</td>
                  <td className="cell-actions">
                    <Link
                      className="btn btn--ghost btn--sm"
                      to={`/students/${student.id}`}
                    >
                      Abrir ficha
                    </Link>
                    <button
                      className="btn btn--danger btn--sm"
                      onClick={() => remove(student.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {visibleStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-empty">
                    {students.loading
                      ? "Carregando alunos..."
                      : search
                        ? "Nenhum aluno encontrado para esta busca."
                        : "Nenhum aluno cadastrado ainda."}
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
