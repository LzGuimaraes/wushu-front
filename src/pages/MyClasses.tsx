import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyEnrollments } from "../api";
import { PageHeader } from "../components/PageHeader";
import { Alert } from "../components/Alert";
import { escola } from "../config/escola";
import { ENROLLMENT_STATUS_LABELS } from "../utils/labels";
import { statusOf } from "../utils/apiError";
import type { EnrollmentWithClasses } from "../types";

export default function MyClasses() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithClasses[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await getMyEnrollments();
      setEnrollments(data);
    } catch (requestError) {
      if (statusOf(requestError) !== 404) {
        setError("Não foi possível carregar suas turmas.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const classes = enrollments.flatMap((enrollment) =>
    enrollment.classes.map((turma) => ({
      enrollment,
      turma,
    })),
  );

  return (
    <div>
      <PageHeader
        titulo="Minhas turmas"
        subtitle="As turmas em que você está matriculado."
        backTo="/portal"
      />

      {error && <Alert onDismiss={() => setError("")}>{error}</Alert>}

      {loading && <p className="muted">Carregando…</p>}

      {!loading && classes.length === 0 && (
        <div className="card">
          <p>
            Você ainda não está em nenhuma turma. Fale com a escola para
            escolher sua turma!
          </p>
          <a
            href={escola.contato.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="btn btn--red"
          >
            Falar com a escola
          </a>
        </div>
      )}

      <div className="cards">
        {classes.map(({ enrollment, turma }) => (
          <article className="card" key={turma.id + enrollment.id}>
            <h3 className="landing-class__name">{turma.name}</h3>
            <dl className="data-list data-list--tight">
              <div>
                <dt>Instrutor</dt>
                <dd>{turma.instructor.name}</dd>
              </div>
              {turma.schedule && (
                <div>
                  <dt>Dias e horários</dt>
                  <dd>{turma.schedule}</dd>
                </div>
              )}
              {turma.description && (
                <div>
                  <dt>Descrição</dt>
                  <dd>{turma.description}</dd>
                </div>
              )}
              <div>
                <dt>Status da matrícula</dt>
                <dd>
                  <span
                    className={`badge badge-${enrollment.status.toLowerCase()}`}
                  >
                    {ENROLLMENT_STATUS_LABELS[enrollment.status] ??
                      enrollment.status}
                  </span>
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <p className="muted">
        <Link to="/portal/pagamentos">Ver minhas mensalidades →</Link>
      </p>
    </div>
  );
}
