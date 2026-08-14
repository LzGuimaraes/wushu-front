import { useCallback, useEffect, useState } from "react";
import {
  approveUser,
  approveUsersBatch,
  listPendingRegistrations,
  rejectUser,
} from "../api";
import { PageHeader } from "../components/PageHeader";
import { Alert } from "../components/Alert";
import { GOAL_LABELS } from "../utils/labels";
import { formatDate, formatPhone } from "../utils/format";
import { getApiErrorMessage } from "../utils/apiError";
import type { PendingRegistration } from "../types";

export default function ApprovalQueue() {
  const [rows, setRows] = useState<PendingRegistration[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  // Rejeição com motivo obrigatório.
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await listPendingRegistrations();
      setRows(data);
      setSelected(new Set());
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível carregar os cadastros pendentes.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (id: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((previous) =>
      previous.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)),
    );
  };

  const handleApprove = async (id: string) => {
    setBusyId(id);
    setError("");
    setSuccess("");
    try {
      await approveUser(id);
      setRows((previous) => previous.filter((row) => row.id !== id));
      setSuccess("Cadastro aprovado e aluno notificado.");
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Não foi possível aprovar o cadastro."),
      );
    } finally {
      setBusyId("");
    }
  };

  const handleApproveBatch = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBusyId("batch");
    setError("");
    setSuccess("");
    try {
      await approveUsersBatch(ids);
      setRows((previous) =>
        previous.filter((row) => !selected.has(row.id)),
      );
      setSelected(new Set());
      setSuccess(`${ids.length} cadastro(s) aprovado(s) em lote.`);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Não foi possível aprovar em lote."),
      );
    } finally {
      setBusyId("");
    }
  };

  const openReject = (id: string) => {
    setRejectTarget(id);
    setRejectReason("");
    setError("");
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setError("Informe o motivo da rejeição.");
      return;
    }
    setBusyId(rejectTarget);
    try {
      await rejectUser(rejectTarget, reason);
      setRows((previous) =>
        previous.filter((row) => row.id !== rejectTarget),
      );
      setSuccess("Cadastro rejeitado e aluno notificado.");
      setRejectTarget(null);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Não foi possível rejeitar o cadastro."),
      );
    } finally {
      setBusyId("");
    }
  };

  return (
    <div>
      <PageHeader
        titulo="Aprovação de cadastros"
        subtitle="Contas de alunos aguardando aprovação do professor."
        backTo="/admin"
      />

      {error && <Alert onDismiss={() => setError("")}>{error}</Alert>}
      {success && (
        <Alert type="success" onDismiss={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {selected.size > 0 && (
        <div className="card form--inline batch-bar">
          <span className="muted">
            {selected.size} selecionado(s)
          </span>
          <button
            type="button"
            className="btn btn--red"
            disabled={busyId !== ""}
            onClick={handleApproveBatch}
          >
            {busyId === "batch" ? "Aprovando..." : "Aprovar selecionados"}
          </button>
        </div>
      )}

      {loading && <p className="muted">Carregando…</p>}

      {!loading && rows.length === 0 && (
        <div className="card">
          <p>Nenhum cadastro aguardando aprovação. 🎉</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Selecionar todos"
                    checked={selected.size === rows.length}
                    onChange={toggleAll}
                  />
                </th>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Objetivo</th>
                <th>Data do cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td data-label="">
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${row.name}`}
                      checked={selected.has(row.id)}
                      onChange={() => toggle(row.id)}
                    />
                  </td>
                  <td data-label="Nome">{row.name}</td>
                  <td data-label="E-mail">{row.email}</td>
                  <td data-label="Telefone">
                    {row.studentProfile ? formatPhone(row.studentProfile.phone) : "—"}
                  </td>
                  <td data-label="Objetivo">
                    {row.studentProfile?.goal
                      ? GOAL_LABELS[row.studentProfile.goal] ?? row.studentProfile.goal
                      : "—"}
                  </td>
                  <td data-label="Data do cadastro">{formatDate(row.createdAt)}</td>
                  <td data-label="Ações" className="cell-actions">
                    <button
                      type="button"
                      className="btn btn--sm btn--green"
                      disabled={busyId !== ""}
                      onClick={() => void handleApprove(row.id)}
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm btn--danger"
                      disabled={busyId !== ""}
                      onClick={() => openReject(row.id)}
                    >
                      Rejeitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectTarget && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-title"
          >
            <h2 id="reject-title">Rejeitar cadastro</h2>
            <p className="muted">
              Informe o motivo — ele ficará visível para o aluno.
            </p>
            <textarea
              className="input"
              rows={3}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Ex.: Não aceitamos menores sem responsável presente."
            />
            <div className="form-actions">
              <button
                type="button"
                className="btn btn--danger"
                disabled={busyId !== ""}
                onClick={() => void confirmReject()}
              >
                {busyId === rejectTarget ? "Rejeitando..." : "Confirmar rejeição"}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setRejectTarget(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
