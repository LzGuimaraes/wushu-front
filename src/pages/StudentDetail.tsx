import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  createBeltHistory,
  deleteBeltHistory,
  getMedicalRecord,
  getStudent,
  listBeltHistory,
  listGuardians,
} from "../api";
import { Alert } from "../components/Alert";
import { Field } from "../components/Field";
import { PageHeader } from "../components/PageHeader";
import { useConfirm } from "../hooks/useConfirm";
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
  todayISO,
} from "../utils/format";
import { GOAL_LABELS, byId } from "../utils/labels";
import { buildPayload } from "../utils/payload";
import type { Schema } from "../utils/validation";
import {
  date,
  maxLength,
  notFuture,
  required,
  requiredWhen,
} from "../utils/validation";

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
  const { askConfirm, confirmDialog } = useConfirm();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [belts, setBelts] = useState<BeltHistory[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const medicalForm = useForm(medicalInitialValues, medicalSchema);
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

  const removeBelt = async (beltId: string) => {
    if (!id) return;
    const ok = await askConfirm("Remover este registro de graduação?", {
      confirmLabel: "Remover",
    });
    if (!ok) return;
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
      {confirmDialog}
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

      <div className="card">
        <h2>Ficha médica</h2>
        <p className="form__note">
          A ficha médica e os responsáveis são preenchidos pelo próprio aluno no
          portal após a aprovação da conta.
        </p>
        <dl className="data-list">
          <div>
            <dt>Doenças</dt>
            <dd>{medicalForm.values.hasDisease === "true" ? medicalForm.values.diseaseDescription || "Sim" : "Não"}</dd>
          </div>
          <div>
            <dt>Medicação</dt>
            <dd>{medicalForm.values.usesMedication === "true" ? medicalForm.values.medicationDescription || "Sim" : "Não"}</dd>
          </div>
          <div>
            <dt>Limitação física</dt>
            <dd>{medicalForm.values.hasPhysicalLimitation === "true" ? medicalForm.values.physicalLimitationDescription || "Sim" : "Não"}</dd>
          </div>
          <div>
            <dt>Alergias</dt>
            <dd>{medicalForm.values.hasAllergy === "true" ? medicalForm.values.allergyDescription || "Sim" : "Não"}</dd>
          </div>
          <div>
            <dt>Lesão anterior</dt>
            <dd>{medicalForm.values.hasPreviousInjury === "true" ? medicalForm.values.previousInjuryDescription || "Sim" : "Não"}</dd>
          </div>
        </dl>
      </div>

      <div className="card">
        <h2>Responsáveis</h2>
        <ul className="list">
          {guardians.map((guardian) => (
            <li key={guardian.id}>
              <span>
                <strong>{guardian.name}</strong> · CPF {formatCpf(guardian.cpf)}{" "}
                · {formatPhone(guardian.phone)}
              </span>
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
