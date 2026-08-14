import { Avatar } from "./Avatar";
import type { PublicInstructor } from "../types";

interface InstructorsGridProps {
  instructors: PublicInstructor[];
  /** Se true, oculta a seção de turmas quando não há turmas cadastradas. */
  emptyMessage?: string;
}

/**
 * Diretório de instrutores reutilizável entre a landing page e a área
 * logada (T2.4). Não expõe e-mail/telefone; contato via canal da escola.
 */
export function InstructorsGrid({
  instructors,
  emptyMessage = "Ainda não há instrutores cadastrados.",
}: InstructorsGridProps) {
  if (instructors.length === 0) {
    return <p className="muted">{emptyMessage}</p>;
  }

  return (
    <div className="instructors-grid">
      {instructors.map((instructor) => (
        <article className="instructor-card" key={instructor.id}>
          <Avatar name={instructor.name} size={56} />
          <h3 className="instructor-card__name">{instructor.name}</h3>
          {instructor.classes.length > 0 ? (
            <ul className="instructor-card__classes">
              {instructor.classes.map((turma) => (
                <li key={turma.id}>
                  <strong>{turma.name}</strong>
                  {turma.schedule && (
                    <span className="muted"> · {turma.schedule}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted instructor-card__none">
              Turmas não informadas
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
