import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Alert } from "../components/Alert";
import { AuthLayout } from "../components/AuthLayout";
import { Field } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { useForm } from "../hooks/useForm";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/apiError";
import type { Schema } from "../utils/validation";
import {
  email,
  maxLength,
  minLength,
  required,
  sameAs,
} from "../utils/validation";

const initialValues = {
  name: "",
  email: "",
  password: "",
  passwordConfirmation: "",
};

const schema: Schema<typeof initialValues> = {
  name: [
    required("Informe seu nome completo"),
    minLength(3, "O nome deve ter pelo menos 3 caracteres"),
    maxLength(50, "O nome deve ter no máximo 50 caracteres"),
  ],
  email: [required("Informe seu e-mail"), email(), maxLength(120)],
  password: [
    required("Crie uma senha"),
    minLength(6, "A senha deve ter pelo menos 6 caracteres"),
    maxLength(20, "A senha deve ter no máximo 20 caracteres"),
  ],
  passwordConfirmation: [
    required("Repita a senha"),
    sameAs("password", "As senhas não são iguais"),
  ],
};

export default function Register() {
  const { register } = useAuth();
  const form = useForm(initialValues, schema);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.validate()) return;

    setLoading(true);
    try {
      const message = await register(
        form.values.name.trim(),
        form.values.email.trim(),
        form.values.password,
      );
      form.reset();
      setSuccess(message);
    } catch (requestError) {
      form.setFieldErrors(getApiFieldErrors(requestError));
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível criar a conta. Tente novamente.",
          {
            409: "Já existe uma conta cadastrada com este e-mail.",
          },
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Cadastre-se para acompanhar matrícula, turmas e mensalidades."
      footer={
        <p>
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      }
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        {error && <Alert onDismiss={() => setError("")}>{error}</Alert>}
        {success && (
          <Alert type="success">
            {success} <Link to="/login">Ir para o login</Link>
          </Alert>
        )}

        <Field
          form={form}
          name="name"
          label="Nome completo"
          required
          maxLength={50}
          autoComplete="name"
          placeholder="Como está no documento"
        />
        <Field
          form={form}
          name="email"
          label="E-mail"
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          placeholder="nome@email.com"
          hint="Enviaremos um link de confirmação para este endereço."
        />
        <Field
          form={form}
          name="password"
          label="Senha"
          type="password"
          required
          maxLength={20}
          autoComplete="new-password"
          hint="De 6 a 20 caracteres."
        />
        <Field
          form={form}
          name="passwordConfirmation"
          label="Repita a senha"
          type="password"
          required
          maxLength={20}
          autoComplete="new-password"
        />

        <button
          className="btn btn--red btn--block"
          type="submit"
          disabled={loading}
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>
    </AuthLayout>
  );
}
