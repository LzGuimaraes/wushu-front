import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface Crumb {
  label: string;
  to: string;
}

interface PageHeaderProps {
  titulo: string;
  subtitle?: string;
  /** Pai hierárquico da rota. Navegação "para trás" NÃO usa history.back(). */
  backTo?: string;
  breadcrumb?: Crumb[];
  actions?: ReactNode;
}

/**
 * Cabeçalho único das telas internas (T4.1).
 * O botão de voltar navega para o PAI HIERÁRQUICO da rota (`backTo`),
 * nunca pelo histórico do navegador — funciona após redirect/link direto.
 */
export function PageHeader({
  titulo,
  subtitle,
  backTo,
  breadcrumb,
  actions,
}: PageHeaderProps) {
  return (
    <header className="page-head page-head--with-back">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="breadcrumb" aria-label="Trilha de navegação">
          {breadcrumb.map((crumb, index) => (
            <span key={crumb.to + index} className="breadcrumb__item">
              {index > 0 && (
                <span className="breadcrumb__sep" aria-hidden="true">
                  /
                </span>
              )}
              {index === breadcrumb.length - 1 ? (
                <span aria-current="page">{crumb.label}</span>
              ) : (
                <Link to={crumb.to}>{crumb.label}</Link>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="page-head__row">
        {backTo && (
          <Link to={backTo} className="back-link" aria-label="Voltar">
            <span className="back-link__icon" aria-hidden="true">
              ←
            </span>
            <span>Voltar</span>
          </Link>
        )}
        <div className="page-head__titles">
          <h1>{titulo}</h1>
          {subtitle && <p className="page-head__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-head__actions">{actions}</div>}
      </div>
    </header>
  );
}
