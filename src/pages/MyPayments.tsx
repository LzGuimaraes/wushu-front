import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyPayments } from "../api";
import { PageHeader } from "../components/PageHeader";
import { Alert } from "../components/Alert";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_TONE_CLASS,
  paymentStatusView,
} from "../utils/labels";
import { formatCompetence, formatDate, formatMoney } from "../utils/format";
import { statusOf } from "../utils/apiError";
import type { Payment } from "../types";

export default function MyPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [noProfile, setNoProfile] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await getMyPayments();
      setPayments(data);
    } catch (requestError) {
      if (statusOf(requestError) === 404) {
        setNoProfile(true);
      } else {
        setError("Não foi possível carregar seus pagamentos.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Mais recente primeiro.
  const ordered = useMemo(
    () =>
      [...payments].sort((a, b) =>
        b.competence.localeCompare(a.competence),
      ),
    [payments],
  );

  const hasPending = ordered.some(
    (payment) => payment.status === "PENDING" || payment.status === "OVERDUE",
  );

  if (noProfile) {
    return (
      <div>
        <PageHeader
          titulo="Meus pagamentos"
          subtitle="Histórico de mensalidades."
          backTo="/portal"
        />
        <div className="card">
          <p>
            Complete seu cadastro para visualizar as mensalidades.{" "}
            <Link to="/portal">Ir para o meu portal</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        titulo="Meus pagamentos"
        subtitle="Histórico de mensalidades, da mais recente para a mais antiga."
        backTo="/portal"
      />

      {error && <Alert onDismiss={() => setError("")}>{error}</Alert>}

      {hasPending && (
        <Alert type="info">
          Você tem mensalidade{" "}
          <strong>aguardando pagamento ou em atraso</strong>. Regularize para
          manter sua matrícula ativa!
        </Alert>
      )}

      {loading && <p className="muted">Carregando…</p>}

      {!loading && ordered.length === 0 && (
        <div className="card">
          <p>Você ainda não tem mensalidades lançadas.</p>
        </div>
      )}

      {ordered.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mês de referência</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Forma</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((payment) => {
                const view = paymentStatusView(payment.status);
                return (
                  <tr key={payment.id}>
                    <td data-label="Mês de referência">
                      {formatCompetence(payment.competence)}
                    </td>
                    <td data-label="Valor">{formatMoney(payment.amount)}</td>
                    <td data-label="Vencimento">{formatDate(payment.dueDate)}</td>
                    <td data-label="Forma">
                      {PAYMENT_METHOD_LABELS[payment.paymentMethod] ??
                        payment.paymentMethod}
                    </td>
                    <td data-label="Status">
                      <span className={`badge ${PAYMENT_TONE_CLASS[view.tone]}`}>
                        {view.label}
                      </span>
                      {payment.notes && (
                        <p className="muted payment-notes">
                          {payment.notes}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
