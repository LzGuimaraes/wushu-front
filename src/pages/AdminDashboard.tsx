import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  approveUser,
  getAdminDashboard,
  getAdminStudentsReportPdf,
  listPendingRegistrations,
  listUsers,
  rejectUser,
} from "../api";
import { PageHeader } from "../components/PageHeader";
import { Alert } from "../components/Alert";
import exportPendingRegistrationsPdf from "../utils/pdf";
import { currentMonthISO } from "../utils/format";
import { getApiErrorMessage } from "../utils/apiError";
import type { AdminDashboard as DashboardData, User } from "../types";

const userStatusLabels: Record<User["status"], string> = {
  PENDING: "Sem aprovação",
  ACTIVE: "Aprovado",
  INACTIVE: "Rejeitado",
  SUSPENDED: "Suspenso",
};

const userStatusClass: Record<User["status"], string> = {
  PENDING: "status-pill status-pill--pending",
  ACTIVE: "status-pill status-pill--active",
  INACTIVE: "status-pill status-pill--inactive",
  SUSPENDED: "status-pill status-pill--suspended",
};

export default function AdminDashboard() {
  const [month, setMonth] = useState(currentMonthISO());
  const [data, setData] = useState<DashboardData | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"" | "paid" | "unpaid" | "pending">(
    "",
  );

  const load = useCallback(async (targetMonth: string) => {
    setLoading(true);
    setError("");
    try {
      const [dashboardResult, usersResult] = await Promise.allSettled([
        getAdminDashboard(targetMonth),
        listUsers(),
      ]);

      if (dashboardResult.status === "fulfilled") {
        setData(dashboardResult.value.data);
      }

      if (usersResult.status === "fulfilled") {
        setStudents(usersResult.value.data.filter((user) => user.role === "STUDENT"));
      }

      if (dashboardResult.status === "rejected") {
        setError(
          getApiErrorMessage(
            dashboardResult.reason,
            "Não foi possível carregar o painel.",
          ),
        );
      }
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

  const handleApproveStudent = async (userId: string) => {
    setUpdatingStudentId(userId);
    setError("");
    try {
      await approveUser(userId);
      setStudents((previous) =>
        previous.map((student) =>
          student.id === userId ? { ...student, status: "ACTIVE" } : student,
        ),
      );
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Não foi possível aprovar o aluno."),
      );
    } finally {
      setUpdatingStudentId(null);
    }
  };

  const handleRejectStudent = async (userId: string) => {
    const reason = window.prompt("Informe o motivo da rejeição:");
    if (!reason || !reason.trim()) return;

    setUpdatingStudentId(userId);
    setError("");
    try {
      await rejectUser(userId, reason.trim());
      setStudents((previous) =>
        previous.map((student) =>
          student.id === userId ? { ...student, status: "INACTIVE" } : student,
        ),
      );
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Não foi possível rejeitar o aluno."),
      );
    } finally {
      setUpdatingStudentId(null);
    }
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

      <div className="card">
        <h2>Alunos e aprovação</h2>
        <div className="student-cards">
          {students.map((student) => (
            <article className="student-card" key={student.id}>
              <div className="student-card__header">
                <strong>{student.name}</strong>
                <span className={userStatusClass[student.status]}>
                  {userStatusLabels[student.status]}
                </span>
              </div>

              <div className="student-card__body">
                <span>{student.email}</span>
                <small>Criado em {new Date(student.createdAt).toLocaleDateString("pt-BR")}</small>
              </div>

              <div className="student-card__actions">
                <button
                  type="button"
                  className="btn btn--sm btn--green"
                  disabled={student.status === "ACTIVE" || updatingStudentId === student.id}
                  onClick={() => void handleApproveStudent(student.id)}
                >
                  {student.status === "ACTIVE" ? "Aprovado" : "Aprovar"}
                </button>
                <button
                  type="button"
                  className="btn btn--sm btn--danger"
                  disabled={student.status === "INACTIVE" || updatingStudentId === student.id}
                  onClick={() => void handleRejectStudent(student.id)}
                >
                  {student.status === "INACTIVE" ? "Rejeitado" : "Rejeitar"}
                </button>
              </div>
            </article>
          ))}
        </div>

        {students.length === 0 && (
          <p className="muted">Nenhum aluno cadastrado no sistema.</p>
        )}
      </div>

      <p className="muted">
        Nota: o schema atual não possui estado de "comprovante enviado"; o card
        "Mensalidades pendentes" conta pagamentos com status{" "}
        <em>Aguardando pagamento</em>.
      </p>
    </div>
  );
}
