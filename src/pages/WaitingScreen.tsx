import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { escola, waLink } from "../config/escola";

/**
 * Tela de "aguardando aprovação" (T1.3).
 * Todo usuário autenticado com conta não aprovada é redirecionado para cá
 * pelo guard RequireApproved; o mesmo vale logo após o cadastro.
 */
export default function WaitingScreen() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  if (!token || !user) {
    return <Navigate to="/cadastro" replace />;
  }

  if (user.status === "ACTIVE") {
    return <Navigate to="/" replace />;
  }

  const rejected = user.status === "INACTIVE";
  const suspended = user.status === "SUSPENDED";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <span className="auth-brand__han" aria-hidden="true">
          {escola.han}
        </span>
        <span className="auth-brand__title">{escola.nomeCurto}</span>
        <p className="auth-brand__lead">{escola.slogan}</p>
      </aside>

      <main className="auth-panel">
        <div className="auth-card waiting-card">
          <div className="auth-card__head">
            <h1 className="waiting-card__title">
              {rejected
                ? "Cadastro não aprovado"
                : suspended
                  ? "Conta suspensa"
                  : "Aguardando aprovação"}
            </h1>
          </div>

          {suspended ? (
            <p>
              Sua conta está suspensa. Entre em contato com a escola para
              resolver a situação.
            </p>
          ) : rejected ? (
            <>
              <p>
                Infelizmente seu cadastro não foi aprovado. Se você acha que
                isso é um engano, fale com a escola para recorrer da decisão.
              </p>
              <p>
                Você pode falar com a escola pelo WhatsApp — clique no botão
                abaixo e conte o que aconteceu.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>Cadastro recebido!</strong> Estamos analisando a sua
                inscrição.
              </p>
              <p>
                Assim que o professor aprovar sua conta, você recebe a
                liberação para acessar o portal do aluno — prazo estimado de{" "}
                <strong>{escola.prazos.aprovacao}</strong>.
              </p>
            </>
          )}

          <div className="waiting-card__actions">
            <a
              href={waLink("Olá! Meu cadastro está aguardando aprovação. 🙂")}
              target="_blank"
              rel="noreferrer"
              className="btn btn--red"
            >
              Falar com a escola no WhatsApp
            </a>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
