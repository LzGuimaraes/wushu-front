import { useEffect, useState } from "react";
import { listPublicInstructors } from "../api";
import { PageHeader } from "../components/PageHeader";
import { InstructorsGrid } from "../components/InstructorsGrid";
import { Alert } from "../components/Alert";
import type { PublicInstructor } from "../types";

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<PublicInstructor[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listPublicInstructors()
      .then(({ data }) => {
        if (active) setInstructors(data);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os instrutores.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <PageHeader
        titulo="Instrutores"
        subtitle="Conheça quem conduz os treinos."
        backTo="/portal"
      />
      {error && <Alert onDismiss={() => setError("")}>{error}</Alert>}
      {loading && <p className="muted">Carregando…</p>}
      {!loading && <InstructorsGrid instructors={instructors} />}
      <p className="muted">
        Para falar com um instrutor, use o contato da escola —{" "}
        <a href="/#contato">ver contatos</a>.
      </p>
    </div>
  );
}
