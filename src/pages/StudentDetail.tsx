import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  createBeltHistory,
  createGuardian,
  deleteBeltHistory,
  deleteGuardian,
  getMedicalRecord,
  getStudent,
  listBeltHistory,
  listGuardians,
  upsertMedicalRecord,
} from "../api";
import { Alert } from "../components/Alert";
import { Field, SelectField, TextareaField } from "../components/Field";
import type { Option } from "../components/Field";
import { PageHeader } from "../components/PageHeader";
import { useForm } from "../hooks/useForm";
import { useUsers } from "../hooks/useReferenceData";
import type {
  BeltHistory,
  Guardian,
  MedicalRecord,
  StudentProfile,
} from "../types";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/apiError";
import {
  formatCep,
  formatCpf,
  formatDate,
  formatPhone,
  maskCpf,
  maskPhone,
  onlyDigits,
  todayISO,
} from "../utils/format";
import { GOAL_LABELS, byId } from "../utils/labels";
import { buildPayload } from "../utils/payload";
import type { Schema } from "../utils/validation";
import {
  cpf as cpfRule,
  date,
  maxLength,
  notFuture,
  phone,
  required,
  requiredWhen,
} from "../utils/validation";

const YES_NO: Option[] = [
  { value: "false", label: "Não" },
  { value: "true", label: "Sim" },
];

const medicalInitialValues = {
  hasDisease: "false",
  diseaseDescription: "",
  usesMedication: "false",
  medicationDescription: "",
  hasPhysicalLimitation: "false",
  physicalLimitationDescription: "",
  hasAllergy: "false",
  allergyDescription: "",
  hasPreviousInjury: "false",
  previousInjuryDescription: "",
};

const medicalSchema: Schema<typeof medicalInitialValues> = {
  diseaseDescription: [
    requiredWhen((values) => values.hasDisease === "true", "Descreva a doença"),
    maxLength(300),
  ],
  medicationDescription: [
    requiredWhen(
      (values) => values.usesMedication === "true",
      "Descreva as medicações",
    ),
    maxLength(300),
  ],
  physicalLimitationDescription: [
    requiredWhen(
      (values) => values.hasPhysicalLimitation === "true",
      "Descreva a limitação física",
    ),
    maxLength(300),
  ],
  allergyDescription: [
    requiredWhen(
      (values) => values.hasAllergy === "true",
      "Descreva as alergias",
    ),
    maxLength(300),
  ],
  previousInjuryDescription: [
    requiredWhen(
      (values) => values.hasPreviousInjury === "true",
      "Descreva a lesão anterior",
    ),
    maxLength(300),
  ],
};

const guardianInitialValues = { name: "", cpf: "", phone: "" };
const guardianSchema: Schema<typeof guardianInitialValues> = {
  name: [required("Informe o nome do responsável"), maxLength(80)],
  cpf: [required("Informe o CPF"), cpfRule()],
  phone: [required("Informe o telefone"), phone()],
};

const beltInitialValues = { belt: "", graduationDate: "", notes: "" };
const beltSchema: Schema<typeof beltInitialValues> = {
  belt: [required("Informe a faixa"), maxLength(30)],
  graduationDate: [date(), notFuture("A graduação não pode estar no futuro")],
  notes: [maxLength(200)],
};

const toMedicalValues = (
  record: MedicalRecord,
): typeof medicalInitialValues => ({
  hasDisease: String(record.hasDisease),
  diseaseDescription: record.diseaseDescription ?? "",
  usesMedication: String(record.usesMedication),
  medicationDescription: record.medicationDescription ?? "",
  hasPhysicalLimitation: String(record.hasPhysicalLimitation),
  physicalLimitationDescription: record.physicalLimitationDescription ?? "",
  hasAllergy: String(record.hasAllergy),
  allergyDescription: record.allergyDescription ?? "",
  hasPreviousInjury: String(record.hasPreviousInjury),
  previousInjuryDescription: record.previousInjuryDescription ?? "",
});

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const users = useUsers();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [belts, setBelts] = useState<BeltHistory[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const medicalForm = useForm(medicalInitialValues, medicalSchema);
  const guardianForm = useForm(guardianInitialValues, guardianSchema);
  const beltForm = useForm(beltInitialValues, beltSchema);

  const usersById = useMemo(() => byId(users.items), [users.items]);
  const studentName = profile
    ? (usersById.get(profile.userId)?.name ?? "Aluno")
    : "Aluno";

  // `medicalForm.reset` muda a cada render; a ficha só é recarregada por `load`.
  const resetMedical = medicalForm.reset;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await getStudent(id);
      setProfile(data);
    } catch (requestError) {
      setProfile(null);
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível carregar a ficha do aluno.",
        ),
      );
      setLoading(false);
      return;
    }

    const [medicalResult, guardiansResult, beltsResult] =
      await Promise.allSettled([
        getMedicalRecord(id),
        listGuardians(id),
        listBeltHistory(id),
      ]);

    // Sem ficha médica ainda (404): mantém os valores padrão do formulário.
    if (medicalResult.status === "fulfilled") {
      resetMedical(toMedicalValues(medicalResult.value.data));
    }
    setGuardians(
      guardiansResult.status === "fulfilled" ? guardiansResult.value.data : [],
    );
    setBelts(beltsResult.status === "fulfilled" ? beltsResult.value.data : []);
    setLoading(false);
  }, [id, resetMedical]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveMedical = async (event: FormEvent) => {
    event.preventDefault();
    if (!id) return;
    setError("");
    setSuccess("");
    if (!medicalForm.validate()) return;

    const values = medicalForm.values;
    const describe = (flag: string, description: string) =>
      flag === "true" ? description.trim() : "";

    try {
      await upsertMedicalRecord(id, {
        hasDisease: values.hasDisease === "true",
        diseaseDescription: describe(
          values.hasDisease,
          values.diseaseDescription,
        ),
        usesMedication: values.usesMedication === "true",
        medicationDescription: describe(
          values.usesMedication,
          values.medicationDescription,
        ),
        hasPhysicalLimitation: values.hasPhysicalLimitation === "true",
        physicalLimitationDescription: describe(
          values.hasPhysicalLimitation,
          values.physicalLimitationDescription,
        ),
        hasAllergy: values.hasAllergy === "true",
        allergyDescription: describe(
          values.hasAllergy,
          values.allergyDescription,
        ),
        hasPreviousInjury: values.hasPreviousInjury === "true",
        previousInjuryDescription: describe(
          values.hasPreviousInjury,
          values.previousInjuryDescription,
        ),
      });
      setSuccess("Ficha médica salva.");
    } catch (requestError) {
      medicalForm.setFieldErrors(getApiFieldErrors(requestError));
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível salvar a ficha médica.",
        ),
      );
    }
  };

  const addGuardian = async (event: FormEvent) => {
    event.preventDefault();
    if (!id) return;
    setError("");
    setSuccess("");
    if (!guardianForm.validate()) return;

    try {
      await createGuardian({
        studentProfileId: id,
        name: guardianForm.values.name.trim(),
        cpf: onlyDigits(guardianForm.values.cpf),
        phone: onlyDigits(guardianForm.values.phone),
      });
      guardianForm.reset();
      setSuccess("Responsável adicionado.");
      const { data } = await listGuardians(id);
      setGuardians(data);
    } catch (requestError) {
      guardianForm.setFieldErrors(getApiFieldErrors(requestError));
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível adicionar o responsável.",
        ),
      );
    }
  };

  const addBelt = async (event: FormEvent) => {
    event.preventDefault();
    if (!id) return;
    setError("");
    setSuccess("");
    if (!beltForm.validate()) return;

    try {
      await createBeltHistory(
        buildPayload({
          studentProfileId: id,
          belt: beltForm.values.belt,
          graduationDate: beltForm.values.graduationDate,
          notes: beltForm.values.notes,
        }),
      );
      beltForm.reset();
      setSuccess("Graduação registrada.");
      const { data } = await listBeltHistory(id);
      setBelts(data);
    } catch (requestError) {
      beltForm.setFieldErrors(getApiFieldErrors(requestError));
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível registrar a graduação.",
        ),
      );
    }
  };

  const removeGuardian = async (guardianId: string) => {
    if (!id || !window.confirm("Remover este responsável?")) return;
    setError("");
    setSuccess("");
    try {
      await deleteGuardian(guardianId);
      const { data } = await listGuardians(id);
      setGuardians(data);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível remover o responsável.",
        ),
      );
    }
  };

  const removeBelt = async (beltId: string) => {
    if (!id || !window.confirm("Remover este registro de graduação?")) return;
    setError("");
    setSuccess("");
    try {
      await deleteBeltHistory(beltId);
      const { data } = await listBeltHistory(id);
      setBelts(data);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível remover a graduação.",
        ),
      );
    }
  };

  if (loading) {
    return (
      <div className="card">
        <p className="muted">Carregando ficha do aluno...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        {error && <Alert>{error}</Alert>}
        <p className="muted">
          <Link to="/students">Voltar para a lista de alunos</Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        titulo={studentName}
        subtitle="Ficha completa do aluno."
        backTo="/students"
        breadcrumb={[
          { label: "Dashboard", to: "/admin" },
          { label: "Alunos", to: "/students" },
          { label: studentName, to: "" },
        ]}
      />

      {error && <Alert onDismiss={() => setError("")}>{error}</Alert>}
      {success && (
        <Alert type="success" onDismiss={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <div className="card">
        <h2>Dados pessoais</h2>
        <dl className="data-list">
          <div>
            <dt>CPF</dt>
            <dd>{formatCpf(profile.cpf)}</dd>
          </div>
          <div>
            <dt>Nascimento</dt>
            <dd>{formatDate(profile.birthDate)}</dd>
          </div>
          <div>
            <dt>Telefone</dt>
            <dd>{formatPhone(profile.phone)}</dd>
          </div>
          <div>
            <dt>Telefone do responsável</dt>
            <dd>{formatPhone(profile.responsiblePhone)}</dd>
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
            <dt>Contato de emergência</dt>
            <dd>{profile.emergencyContact ?? "—"}</dd>
          </div>
          <div>
            <dt>Endereço</dt>
            <dd>
              {profile.address}, {profile.district} — {profile.city} · CEP{" "}
              {formatCep(profile.zipCode)}
            </dd>
          </div>
        </dl>
      </div>

      <form className="card form" onSubmit={saveMedical} noValidate>
        <h2>Ficha médica</h2>
        <p className="form__note">
          Marque &ldquo;Sim&rdquo; e descreva o caso — a descrição fica
          obrigatória quando houver ocorrência.
        </p>
        <div className="form-grid">
          <SelectField
            form={medicalForm}
            name="hasDisease"
            label="Possui doença?"
            options={YES_NO}
          />
          <TextareaField
            form={medicalForm}
            name="diseaseDescription"
            label="Qual doença"
            disabled={medicalForm.values.hasDisease !== "true"}
            maxLength={300}
          />
          <SelectField
            form={medicalForm}
            name="usesMedication"
            label="Usa medicação?"
            options={YES_NO}
          />
          <TextareaField
            form={medicalForm}
            name="medicationDescription"
            label="Quais medicações"
            disabled={medicalForm.values.usesMedication !== "true"}
            maxLength={300}
          />
          <SelectField
            form={medicalForm}
            name="hasPhysicalLimitation"
            label="Limitação física?"
            options={YES_NO}
          />
          <TextareaField
            form={medicalForm}
            name="physicalLimitationDescription"
            label="Qual limitação"
            disabled={medicalForm.values.hasPhysicalLimitation !== "true"}
            maxLength={300}
          />
          <SelectField
            form={medicalForm}
            name="hasAllergy"
            label="Alergias?"
            options={YES_NO}
          />
          <TextareaField
            form={medicalForm}
            name="allergyDescription"
            label="Quais alergias"
            disabled={medicalForm.values.hasAllergy !== "true"}
            maxLength={300}
          />
          <SelectField
            form={medicalForm}
            name="hasPreviousInjury"
            label="Lesão anterior?"
            options={YES_NO}
          />
          <TextareaField
            form={medicalForm}
            name="previousInjuryDescription"
            label="Qual lesão"
            disabled={medicalForm.values.hasPreviousInjury !== "true"}
            maxLength={300}
          />
        </div>
        <div className="form-actions">
          <button className="btn btn--red" type="submit">
            Salvar ficha médica
          </button>
        </div>
      </form>

      <div className="card">
        <h2>Responsáveis</h2>
        <form className="form" onSubmit={addGuardian} noValidate>
          <div className="form-grid">
            <Field
              form={guardianForm}
              name="name"
              label="Nome"
              required
              maxLength={80}
            />
            <Field
              form={guardianForm}
              name="cpf"
              label="CPF"
              required
              mask={maskCpf}
              inputMode="numeric"
              placeholder="000.000.000-00"
            />
            <Field
              form={guardianForm}
              name="phone"
              label="Telefone"
              required
              mask={maskPhone}
              inputMode="tel"
              placeholder="(65) 90000-0000"
            />
          </div>
          <div className="form-actions">
            <button className="btn btn--red" type="submit">
              Adicionar responsável
            </button>
          </div>
        </form>

        <ul className="list">
          {guardians.map((guardian) => (
            <li key={guardian.id}>
              <span>
                <strong>{guardian.name}</strong> · CPF {formatCpf(guardian.cpf)}{" "}
                · {formatPhone(guardian.phone)}
              </span>
              <button
                className="btn btn--danger btn--sm"
                onClick={() => removeGuardian(guardian.id)}
              >
                Remover
              </button>
            </li>
          ))}
          {guardians.length === 0 && (
            <li className="muted">Nenhum responsável cadastrado.</li>
          )}
        </ul>
      </div>

      <div className="card">
        <h2>Histórico de graduações</h2>
        <form className="form" onSubmit={addBelt} noValidate>
          <div className="form-grid">
            <Field
              form={beltForm}
              name="belt"
              label="Faixa"
              required
              maxLength={30}
              placeholder="Ex.: preta 1º grau"
            />
            <Field
              form={beltForm}
              name="graduationDate"
              label="Data da graduação"
              type="date"
              max={todayISO()}
            />
            <Field
              form={beltForm}
              name="notes"
              label="Observações"
              maxLength={200}
            />
          </div>
          <div className="form-actions">
            <button className="btn btn--red" type="submit">
              Registrar graduação
            </button>
          </div>
        </form>

        <ul className="list">
          {belts.map((belt) => (
            <li key={belt.id}>
              <span>
                <strong>{belt.belt}</strong>
                {belt.graduationDate
                  ? ` · ${formatDate(belt.graduationDate)}`
                  : ""}
                {belt.notes ? ` · ${belt.notes}` : ""}
              </span>
              <button
                className="btn btn--danger btn--sm"
                onClick={() => removeBelt(belt.id)}
              >
                Remover
              </button>
            </li>
          ))}
          {belts.length === 0 && (
            <li className="muted">Nenhuma graduação registrada.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
