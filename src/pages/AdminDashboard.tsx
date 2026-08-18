import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAdminDashboard,
  getAdminStudentsReportPdf,
  listPendingRegistrations,
} from "../api";
import { PageHeader } from "../components/PageHeader";
import { Alert } from "../components/Alert";
import exportPendingRegistrationsPdf from "../utils/pdf";
import { currentMonthISO } from "../utils/format";
import { getApiErrorMessage } from "../utils/apiError";
import type { AdminDashboard as DashboardData } from "../types";

export default function AdminDashboard() {
  const [month, setMonth] = useState(currentMonthISO());
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"" | "paid" | "unpaid" | "pending">(
    "",
  );

  const load = useCallback(async (targetMonth: string) => {
    setLoading(true);
    setError("");
    try {
      const { data: dashboard } = await getAdminDashboard(targetMonth);
      setData(dashboard);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível carregar o painel.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(month);
  }, [month, load]);

  const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMonth(event.target.value);
  };

  const exportStudents = async (paidInMonth: boolean) => {
    const key = paidInMonth ? "paid" : "unpaid";
    setExporting(key);
    setError("");
    try {
      // Backend serves a PDF with the students report for the requested month.
      const { data: blob } = await getAdminStudentsReportPdf(month);
      const url = URL.createObjectURL(blob as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `alunos-${paidInMonth ? "em-dia" : "nao-pagos"}-${month}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Falha ao exportar PDF."));
    } finally {
      setExporting("");
    }
  };

  const exportPending = async () => {
    setExporting("pending");
    setError("");
    try {
      const { data: rows } = await listPendingRegistrations();
      exportPendingRegistrationsPdf(`cadastros-pendentes-${month}.pdf`, rows, month);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Falha ao exportar PDF."));
    } finally {
      setExporting("");
    }
  };

  const counts = data?.counts;

  const cards = [
    {
      key: "pending",
      label: "Cadastros aguardando aprovação",
      value: counts?.pendingRegistrations ?? 0,
      tone: "pending",
      to: "/admin/aprovacoes",
      onCsv: exportPending,
      disabled: !counts || counts.pendingRegistrations === 0,
    },
    {
      key: "paid",
      label: "Cadastrados e em dia",
      value: counts?.activePaid ?? 0,
      tone: "paid",
      to: "/students",
      onCsv: () => void exportStudents(true),
      disabled: !counts || counts.activePaid === 0,
    },
    {
      key: "unpaid",
      label: "Cadastrados e não pagos",
      value: counts?.activeUnpaid ?? 0,
      tone: "overdue",
      to: "/students",
      onCsv: () => void exportStudents(false),
      disabled: !counts || counts.activeUnpaid === 0,
    },
    {
      key: "pendingPayments",
      label: "Mensalidades pendentes",
      value: counts?.pendingPayments ?? 0,
      tone: "pending",
      to: "/payments",
      onCsv: undefined,
      disabled: true,
    },
  ];

  return (
    <div>
      <PageHeader
        titulo="Dashboard"
        subtitle="Visão geral da escola. Seletor de mês afeta os cards financeiros."
      />

      {error && <Alert onDismiss={() => setError("")}>{error}</Alert>}

      <div className="card form form--inline dashboard-month">
        <label htmlFor="dashboard-month">
          Mês de referência
          <input
            id="dashboard-month"
            className="input"
            type="month"
            value={month}
            onChange={handleMonthChange}
          />
        </label>
        <span className="muted">
          {loading ? "Atualizando…" : `Contagens de ${month}`}
        </span>
      </div>

      <div className="stat-cards">
        {cards.map((card) => (
          <article className={`stat-card stat-card--${card.tone}`} key={card.key}>
            <span className="stat-card__value">{card.value}</span>
            <span className="stat-card__label">{card.label}</span>
            <div className="stat-card__actions">
              <Link className="link-button" to={card.to}>
                Ver lista →
              </Link>
              {card.onCsv && (
                <button
                  type="button"
                  className="link-button"
                  disabled={card.disabled || exporting !== ""}
                  onClick={card.onCsv}
                >
                  {exporting === card.key ? "Exportando…" : "Exportar PDF"}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <p className="muted">
        Nota: o schema atual não possui estado de "comprovante enviado"; o card
        "Mensalidades pendentes" conta pagamentos com status{" "}
        <em>Aguardando pagamento</em>.
      </p>
    </div>
  );
}
