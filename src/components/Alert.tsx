import type { ReactNode } from "react";

interface AlertProps {
  type?: "error" | "success" | "info";
  children: ReactNode;
  onDismiss?: () => void;
}

const ICONS: Record<NonNullable<AlertProps["type"]>, string> = {
  error: "!",
  success: "✓",
  info: "i",
};

export function Alert({ type = "error", children, onDismiss }: AlertProps) {
  return (
    <div
      className={`alert alert--${type}`}
      role={type === "error" ? "alert" : "status"}
    >
      <span className="alert__icon" aria-hidden="true">
        {ICONS[type]}
      </span>
      <div className="alert__text">{children}</div>
      {onDismiss && (
        <button
          type="button"
          className="alert__close"
          onClick={onDismiss}
          aria-label="Fechar aviso"
        >
          ×
        </button>
      )}
    </div>
  );
}
