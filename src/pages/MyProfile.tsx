import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { updateMe, updateMyProfile, getMyProfile } from "../api";
import { PageHeader } from "../components/PageHeader";
import { Alert } from "../components/Alert";
import { Field, SelectField } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { useForm } from "../hooks/useForm";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/apiError";
import { buildPayload } from "../utils/payload";
import { formatCpf, maskCep, maskPhone } from "../utils/format";
import {
  GOAL_OPTIONS,
  MODALITY_OPTIONS,
} from "../utils/labels";
import type { Schema } from "../utils/validation";
import {
  cep,
  date,
  maxLength,
  notFuture,
  phone,
  required,
} from "../utils/validation";
import type { StudentProfile } from "../types";

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

export default function MyProfile() {
  const { user, setUser } = useAuth();
  const accountForm = useForm(accountInitial, accountSchema);
  const profileForm = useForm(profileInitial, profileSchema);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
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
  }, [profileForm]);

  useEffect(() => {
    if (user) accountForm.setValue("name", user.name);
  }, [user, accountForm]);

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
    </div>
  );
}
