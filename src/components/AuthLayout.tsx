import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <span className="auth-brand__han" aria-hidden="true">
          功夫
        </span>
        <p className="eyebrow">Kung Fu Cuiabá</p>
        <h2 className="auth-brand__title">
          Disciplina no tatame,
          <br />
          organização na secretaria
        </h2>
        <p className="auth-brand__lead">
          Alunos, matrículas, turmas, frequência e mensalidades da escola em um
          só lugar.
        </p>
      </aside>

      <main className="auth-panel">
        <div className="auth-card">
          <Link to="/" className="back-link auth-back-link">
            <span className="back-link__icon" aria-hidden="true">
              ←
            </span>
            Voltar para a página inicial
          </Link>
          <header className="auth-card__head">
            <h1>{title}</h1>
            <p className="muted">{subtitle}</p>
          </header>
          {children}
          <footer className="auth-card__foot">{footer}</footer>
        </div>
      </main>
    </div>
  );
}
