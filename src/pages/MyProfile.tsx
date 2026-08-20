import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  createMyGuardian,
  deleteMyGuardian,
  getMyGuardians,
  getMyMedicalRecord,
  getMyProfile,
  updateMe,
  updateMyProfile,
  upsertMyMedicalRecord,
} from "../api";
import { PageHeader } from "../components/PageHeader";
import { Alert } from "../components/Alert";
import { Field, SelectField, TextareaField } from "../components/Field";
import type { Option } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { useForm } from "../hooks/useForm";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/apiError";
import { buildPayload } from "../utils/payload";
import {
  formatCpf,
  formatPhone,
  maskCep,
  maskCpf,
  maskPhone,
  onlyDigits,
} from "../utils/format";
import {
  GOAL_OPTIONS,
  MODALITY_OPTIONS,
} from "../utils/labels";
import type { Schema } from "../utils/validation";
import {
  cep,
  cpf,
  date,
  maxLength,
  notFuture,
  phone,
  required,
  requiredWhen,
} from "../utils/validation";
import type { Guardian, MedicalRecord, StudentProfile } from "../types";

const accountInitial = {
  name: "",
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

const accountSchema: Schema<typeof accountInitial> = {
  name: [required("Informe seu nome"), maxLength(50)],
  currentPassword: [],
  newPassword: [],
  confirmNewPassword: [],
};

const profileInitial = {
  phone: "",
  responsiblePhone: "",
  birthDate: "",
  emergencyContact: "",
  belt: "",
  goal: "FITNESS",
  goalDescription: "",
  trainingModality: "",
  previousMartialArt: "",
  address: "",
  district: "",
  city: "Cuiabá",
  zipCode: "",
};

const profileSchema: Schema<typeof profileInitial> = {
  phone: [required("Informe seu telefone"), phone()],
  responsiblePhone: [],
  birthDate: [date("Data inválida"), notFuture("A data não pode estar no futuro")],
  emergencyContact: [maxLength(80)],
  belt: [maxLength(30)],
  goal: [],
  goalDescription: [maxLength(200)],
  trainingModality: [required("Informe a modalidade")],
  previousMartialArt: [maxLength(60)],
  address: [maxLength(120)],
  district: [maxLength(60)],
  city: [maxLength(60)],
  zipCode: [cep()],
};

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
  cpf: [required("Informe o CPF"), cpf()],
  phone: [required("Informe o telefone"), phone()],
};

const toMedicalValues = (record: MedicalRecord): typeof medicalInitialValues => ({
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

export default function MyProfile() {
  const { user, setUser } = useAuth();
  const accountForm = useForm(accountInitial, accountSchema);
  const profileForm = useForm(profileInitial, profileSchema);
  const medicalForm = useForm(medicalInitialValues, medicalSchema);
  const guardianForm = useForm(guardianInitialValues, guardianSchema);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await getMyProfile();
      setProfile(data);
      profileForm.reset({
        phone: data.phone,
        responsiblePhone: data.responsiblePhone ?? "",
        birthDate: data.birthDate ?? "",
        emergencyContact: data.emergencyContact ?? "",
        belt: data.belt ?? "",
        goal: data.goal,
        goalDescription: data.goalDescription ?? "",
        trainingModality: data.trainingModality,
        previousMartialArt: data.previousMartialArt ?? "",
        address: data.address,
        district: data.district,
        city: data.city,
        zipCode: data.zipCode,
      });
    } catch {
      // 404 = perfil ainda não preenchido; orientamos a completar.
    }

    try {
      const [medicalResult, guardiansResult] = await Promise.allSettled([
        getMyMedicalRecord(),
        getMyGuardians(),
      ]);

      if (medicalResult.status === "fulfilled") {
        const record = medicalResult.value.data;
        medicalForm.reset(toMedicalValues(record));
      }

      if (guardiansResult.status === "fulfilled") {
        setGuardians(guardiansResult.value.data);
      } else {
        setGuardians([]);
      }
    } catch {
      setGuardians([]);
    }
  }, [medicalForm, profileForm]);

  useEffect(() => {
    if (user) accountForm.setValue("name", user.name);
    // Sincroniza o nome quando o usuário muda. Não pode depender de accountForm:
    // o objeto do form é recriado a cada render e isso criaria um loop infinito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAccount = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!accountForm.validate()) return;
    setSaving(true);
    try {
      const payload = buildPayload({
        name: accountForm.values.name.trim(),
        currentPassword: accountForm.values.currentPassword,
        newPassword: accountForm.values.newPassword,
        confirmNewPassword: accountForm.values.confirmNewPassword,
      });
      const { data } = await updateMe(payload);
      setUser(data);
      accountForm.reset({
        name: data.name,
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setSuccess("Dados da conta atualizados.");
    } catch (requestError) {
      accountForm.setFieldErrors(getApiFieldErrors(requestError));
      setError(
        getApiErrorMessage(requestError, "Não foi possível atualizar a conta."),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleProfile = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!profileForm.validate()) return;
    setSaving(true);
    try {
      const payload = buildPayload({
        phone: profileForm.values.phone,
        responsiblePhone: profileForm.values.responsiblePhone,
        birthDate: profileForm.values.birthDate || undefined,
        emergencyContact: profileForm.values.emergencyContact,
        belt: profileForm.values.belt,
        goal: profileForm.values.goal,
        goalDescription: profileForm.values.goalDescription,
        trainingModality: profileForm.values.trainingModality,
        previousMartialArt: profileForm.values.previousMartialArt,
        address: profileForm.values.address,
        district: profileForm.values.district,
        city: profileForm.values.city,
        zipCode: profileForm.values.zipCode,
      });
      const { data } = await updateMyProfile(payload);
      setProfile(data);
      setSuccess("Dados do aluno atualizados.");
    } catch (requestError) {
      profileForm.setFieldErrors(getApiFieldErrors(requestError));
      setError(
        getApiErrorMessage(requestError, "Não foi possível atualizar o perfil."),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleMedicalRecord = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!medicalForm.validate()) return;

    try {
      const values = medicalForm.values;
      const describe = (flag: string, description: string) =>
        flag === "true" ? description.trim() : "";

      await upsertMyMedicalRecord({
        hasDisease: values.hasDisease === "true",
        diseaseDescription: describe(values.hasDisease, values.diseaseDescription),
        usesMedication: values.usesMedication === "true",
        medicationDescription: describe(values.usesMedication, values.medicationDescription),
        hasPhysicalLimitation: values.hasPhysicalLimitation === "true",
        physicalLimitationDescription: describe(
          values.hasPhysicalLimitation,
          values.physicalLimitationDescription,
        ),
        hasAllergy: values.hasAllergy === "true",
        allergyDescription: describe(values.hasAllergy, values.allergyDescription),
        hasPreviousInjury: values.hasPreviousInjury === "true",
        previousInjuryDescription: describe(
          values.hasPreviousInjury,
          values.previousInjuryDescription,
        ),
      });
      setSuccess("Ficha médica salva com sucesso.");
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

  const handleAddGuardian = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!guardianForm.validate()) return;

    try {
      await createMyGuardian({
        name: guardianForm.values.name.trim(),
        cpf: onlyDigits(guardianForm.values.cpf),
        phone: onlyDigits(guardianForm.values.phone),
      });
      guardianForm.reset();
      const { data } = await getMyGuardians();
      setGuardians(data);
      setSuccess("Responsável adicionado.");
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

  const handleRemoveGuardian = async (guardianId: string) => {
    if (!window.confirm("Remover este responsável?")) return;
    setError("");
    setSuccess("");
    try {
      await deleteMyGuardian(guardianId);
      const { data } = await getMyGuardians();
      setGuardians(data);
      setSuccess("Responsável removido.");
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível remover o responsável.",
        ),
      );
    }
  };

  const noProfile = profile === null;

  return (
    <div>
      <PageHeader
        titulo="Meu perfil"
        subtitle="Atualize seus dados cadastrais."
        backTo="/portal"
      />

      {error && <Alert onDismiss={() => setError("")}>{error}</Alert>}
      {success && (
        <Alert type="success" onDismiss={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <form className="card form" onSubmit={handleAccount} noValidate>
        <h2>Dados da conta</h2>
        <p className="form__note">
          E-mail: <strong>{user?.email}</strong> (não é possível alterar sem
          confirmação). Status e matrículas são gerenciados pela escola.
        </p>
        <div className="form-grid">
          <Field
            form={accountForm}
            name="name"
            label="Nome completo"
            required
            maxLength={50}
            autoComplete="name"
          />
        </div>

        <h3>Trocar senha</h3>
        <p className="form__note">
          Para trocar a senha, informe a senha atual e a nova.
        </p>
        <div className="form-grid">
          <Field
            form={accountForm}
            name="currentPassword"
            label="Senha atual"
            type="password"
            autoComplete="current-password"
          />
          <Field
            form={accountForm}
            name="newPassword"
            label="Nova senha"
            type="password"
            maxLength={20}
            autoComplete="new-password"
          />
          <Field
            form={accountForm}
            name="confirmNewPassword"
            label="Confirme a nova senha"
            type="password"
            maxLength={20}
            autoComplete="new-password"
          />
        </div>

        <div className="form-actions">
          <button className="btn btn--red" type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar conta"}
          </button>
        </div>
      </form>

      <form className="card form" onSubmit={handleProfile} noValidate>
        <h2>Dados do aluno</h2>
        <p className="form__note">
          CPF: <strong>{profile ? formatCpf(profile.cpf) : "—"}</strong> (não
          editável). {noProfile && "Complete seu cadastro para editar."}
        </p>
        <div className="form-grid">
          <Field
            form={profileForm}
            name="phone"
            label="Telefone / WhatsApp"
            required
            mask={maskPhone}
            inputMode="tel"
            autoComplete="tel"
          />
          <Field
            form={profileForm}
            name="responsiblePhone"
            label="Telefone do responsável"
            mask={maskPhone}
            inputMode="tel"
          />
          <Field
            form={profileForm}
            name="birthDate"
            label="Data de nascimento"
            type="date"
            inputMode="numeric"
          />
          <Field
            form={profileForm}
            name="emergencyContact"
            label="Contato de emergência"
            maxLength={80}
          />
          <Field
            form={profileForm}
            name="belt"
            label="Faixa"
            maxLength={30}
            placeholder="Ex.: Branca"
          />
          <SelectField
            form={profileForm}
            name="goal"
            label="Objetivo"
            options={GOAL_OPTIONS}
          />
          <Field
            form={profileForm}
            name="goalDescription"
            label="Descreva seu objetivo"
            maxLength={200}
          />
          <SelectField
            form={profileForm}
            name="trainingModality"
            label="Modalidade"
            options={MODALITY_OPTIONS}
          />
          <Field
            form={profileForm}
            name="previousMartialArt"
            label="Arte marcial anterior"
            maxLength={60}
          />
          <Field
            form={profileForm}
            name="address"
            label="Endereço"
            maxLength={120}
            autoComplete="street-address"
          />
          <Field
            form={profileForm}
            name="district"
            label="Bairro"
            maxLength={60}
          />
          <Field
            form={profileForm}
            name="city"
            label="Cidade"
            maxLength={60}
          />
          <Field
            form={profileForm}
            name="zipCode"
            label="CEP"
            mask={maskCep}
            inputMode="numeric"
          />
        </div>

        <div className="form-actions">
          <button className="btn btn--red" type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar perfil"}
          </button>
        </div>
      </form>

      <form className="card form" onSubmit={handleMedicalRecord} noValidate>
        <h2>Ficha médica</h2>
        <p className="form__note">
          Esta ficha é de responsabilidade do aluno. Preencha os dados de saúde
          para concluir a matrícula.
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
        <p className="form__note">
          O aluno preenche e mantém os dados do responsável diretamente aqui.
        </p>
        <form className="form" onSubmit={handleAddGuardian} noValidate>
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
                <strong>{guardian.name}</strong> · CPF {formatCpf(guardian.cpf)} · {formatPhone(guardian.phone)}
              </span>
              <button
                className="btn btn--danger btn--sm"
                onClick={() => handleRemoveGuardian(guardian.id)}
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
    </div>
  );
}
