import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  completeMyProfile,
  getMyEnrollments,
  getMyPayments,
  getMyProfile,
} from "../api";
import { Alert } from "../components/Alert";
import { Field, SelectField } from "../components/Field";
import { PageHeader } from "../components/PageHeader";
import { useForm } from "../hooks/useForm";
import type { Enrollment, Payment, StudentProfile } from "../types";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/apiError";
import {
  formatCep,
  formatCpf,
  formatDate,
  formatMoney,
  formatPhone,
  maskCep,
  maskCpf,
  maskPhone,
  onlyDigits,
  todayISO,
} from "../utils/format";
import {
  ENROLLMENT_STATUS_LABELS,
  GOAL_LABELS,
  GOAL_OPTIONS,
  MODALITY_OPTIONS,
  PAYMENT_STATUS_LABELS,
} from "../utils/labels";
import { buildPayload } from "../utils/payload";
import type { Schema } from "../utils/validation";
import {
  ageBetween,
  cep,
  cpf,
  date,
  isUnderage,
  maxLength,
  notFuture,
  phone,
  required,
  requiredWhen,
} from "../utils/validation";

const initialValues = {
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
  emergencyContact: "",
};

const schema: Schema<typeof initialValues> = {
  cpf: [required("Informe seu CPF"), cpf()],
  phone: [required("Informe seu telefone"), phone()],
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
  trainingModality: [required("Escolha a modalidade que você treina")],
  goal: [required("Escolha seu objetivo")],
  emergencyContact: [maxLength(80)],
};

const statusOf = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } })?.response?.status;

export default function MyPortal() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const form = useForm(initialValues, schema);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMyProfile();
      setProfile(data);
      setError("");
    } catch (requestError) {
      // 404 significa "ainda não preencheu o cadastro", não é erro.
      setProfile(null);
      if (statusOf(requestError) !== 404) {
        setError(
          getApiErrorMessage(
            requestError,
            "Não foi possível carregar seus dados.",
          ),
        );
        setLoading(false);
        return;
      }
    }

    const [enrollmentsResult, paymentsResult] = await Promise.allSettled([
      getMyEnrollments(),
      getMyPayments(),
    ]);
    setEnrollments(
      enrollmentsResult.status === "fulfilled"
        ? enrollmentsResult.value.data
        : [],
    );
    setPayments(
      paymentsResult.status === "fulfilled" ? paymentsResult.value.data : [],
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.validate()) return;

    setSaving(true);
    try {
      await completeMyProfile(
        buildPayload({
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
          emergencyContact: form.values.emergencyContact,
        }),
      );
      setSuccess(
        "Cadastro concluído! A secretaria já pode gerar sua matrícula.",
      );
      await load();
    } catch (requestError) {
      form.setFieldErrors(getApiFieldErrors(requestError));
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível salvar seu cadastro.",
          {
            409: "Este CPF já está cadastrado em outra ficha de aluno.",
          },
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        titulo="Meu portal"
        subtitle="Acompanhe matrícula, turmas, mensalidades e seu cadastro."
      />

      {error && <Alert onDismiss={() => setError("")}>{error}</Alert>}
      {success && (
        <Alert type="success" onDismiss={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <nav className="portal-nav" aria-label="Atalhos do aluno">
        <Link className="portal-nav__item" to="/portal/turmas">
          <strong>Minhas turmas</strong>
          <span>Veja dias, horários e instrutores</span>
        </Link>
        <Link className="portal-nav__item" to="/portal/pagamentos">
          <strong>Meus pagamentos</strong>
          <span>Acompanhe suas mensalidades</span>
        </Link>
        <Link className="portal-nav__item" to="/portal/perfil">
          <strong>Meu perfil</strong>
          <span>Atualize seus dados</span>
        </Link>
        <Link className="portal-nav__item" to="/portal/instrutores">
          <strong>Instrutores</strong>
          <span>Conheça quem ensina</span>
        </Link>
        <Link className="portal-nav__item" to="/portal/como-funciona">
          <strong>Como funciona</strong>
          <span>Entenda o passo a passo do portal</span>
        </Link>
      </nav>

      {loading ? (
        <div className="card">
          <p className="muted">Carregando suas informações...</p>
        </div>
      ) : !profile ? (
        <form className="card form" onSubmit={submit} noValidate>
          <h2>Complete seu cadastro</h2>
          <p className="form__note">
            Precisamos destes dados para gerar sua matrícula. Campos com{" "}
            <span className="field__required">*</span> são obrigatórios.
          </p>

          <div className="form-grid">
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
                  ? "Obrigatório para menores de 18 anos."
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
            <Field
              form={form}
              name="emergencyContact"
              label="Contato de emergência"
              placeholder="Nome e telefone"
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
          </div>

          <div className="form-actions">
            <button className="btn btn--red" type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar cadastro"}
            </button>
          </div>
        </form>
      ) : (
        <div className="card">
          <h2>Meus dados</h2>
          <dl className="data-list">
            <div>
              <dt>CPF</dt>
              <dd>{formatCpf(profile.cpf)}</dd>
            </div>
            <div>
              <dt>Telefone</dt>
              <dd>{formatPhone(profile.phone)}</dd>
            </div>
            <div>
              <dt>Nascimento</dt>
              <dd>{formatDate(profile.birthDate)}</dd>
            </div>
            <div>
              <dt>Modalidade</dt>
              <dd>{profile.trainingModality}</dd>
            </div>
            <div>
              <dt>Objetivo</dt>
              <dd>{GOAL_LABELS[profile.goal] ?? profile.goal}</dd>
            </div>
            <div>
              <dt>Faixa</dt>
              <dd>{profile.belt ?? "—"}</dd>
            </div>
            <div>
              <dt>Endereço</dt>
              <dd>
                {profile.address}, {profile.district} — {profile.city} · CEP{" "}
                {formatCep(profile.zipCode)}
              </dd>
            </div>
          </dl>
          <p className="muted">
            Precisa corrigir alguma informação? Fale com a secretaria da escola.
          </p>
        </div>
      )}

      <div className="card">
        <h2>Minhas matrículas</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Situação</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td>{enrollment.enrollmentNumber}</td>
                  <td>
                    <span
                      className={`badge badge-${enrollment.status.toLowerCase()}`}
                    >
                      {ENROLLMENT_STATUS_LABELS[enrollment.status] ??
                        enrollment.status}
                    </span>
                  </td>
                  <td>{formatDate(enrollment.registrationDate)}</td>
                </tr>
              ))}
              {enrollments.length === 0 && (
                <tr>
                  <td colSpan={3} className="table-empty">
                    Nenhuma matrícula registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Minhas mensalidades</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{formatMoney(payment.amount)}</td>
                  <td>{formatDate(payment.dueDate)}</td>
                  <td>
                    <span
                      className={`badge badge-${payment.status.toLowerCase()}`}
                    >
                      {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                    </span>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={3} className="table-empty">
                    Nenhuma mensalidade lançada.
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
