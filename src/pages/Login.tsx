import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resendConfirmation } from "../api";
import { Alert } from "../components/Alert";
import { AuthLayout } from "../components/AuthLayout";
import { Field } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { useForm } from "../hooks/useForm";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/apiError";
import type { Schema } from "../utils/validation";
import { email, required } from "../utils/validation";

const initialValues = { email: "", password: "" };

const schema: Schema<typeof initialValues> = {
  email: [required("Informe seu e-mail"), email()],
  password: [required("Informe sua senha")],
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const form = useForm(initialValues, schema);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setNeedsConfirmation(false);
    if (!form.validate()) return;

    setLoading(true);
    try {
      await login(form.values.email.trim(), form.values.password);
      navigate("/");
    } catch (requestError) {
      // O backend responde em português ("Credenciais inválidas" /
      // "Confirme seu e-mail antes de entrar"), então a mensagem dele vem primeiro.
      const message = getApiErrorMessage(
        requestError,
        "Não foi possível entrar agora. Tente novamente em instantes.",
      );
      form.setFieldErrors(getApiFieldErrors(requestError));
      setError(message);
      setNeedsConfirmation(
        message.toLowerCase().includes("confirme seu e-mail"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      const { data } = await resendConfirmation(form.values.email.trim());
      setNeedsConfirmation(false);
      setNotice(data.message);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível reenviar o e-mail de confirmação.",
        ),
      );
    }
  };

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse o painel com o e-mail cadastrado na escola."
      footer={
        <p>
          Ainda não tem conta? <Link to="/register">Criar conta</Link>
        </p>
      }
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        {error && (
          <Alert onDismiss={() => setError("")}>
            {error}
            {needsConfirmation && (
              <button
                type="button"
                className="link-button"
                onClick={handleResend}
              >
                Reenviar e-mail de confirmação
              </button>
            )}
          </Alert>
        )}
        {notice && (
          <Alert type="success" onDismiss={() => setNotice("")}>
            {notice}
          </Alert>
        )}

        <Field
          form={form}
          name="email"
          label="E-mail"
          type="email"
          required
          placeholder="nome@email.com"
          autoComplete="email"
          inputMode="email"
        />
        <Field
          form={form}
          name="password"
          label="Senha"
          type="password"
          required
          autoComplete="current-password"
        />

        <button
          className="btn btn--red btn--block"
          type="submit"
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </AuthLayout>
  );
}
