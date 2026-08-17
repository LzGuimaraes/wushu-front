import { Link } from "react-router-dom";
import { escola } from "../config/escola";
import { InstructorsGrid } from "../components/InstructorsGrid";
import type { LandingData } from "../types";

/* ---------- Dados fixos ---------- */

const instrutores: LandingData["instructors"] = [
  {
    id: "alessandro",
    name: "Alessandro",
    classes: [
      {
        id: "sanda",
        name: "Sanda",
        schedule: "Terça e quinta · 20:00 às 21:30",
      },
    ],
  },
];

const turmas: LandingData["classes"] = [
  {
    id: "sanda",
    name: "Sanda",
    description: "Boxe chinês: socos, chutes, quedas e projeções.",
    schedule: "Terça e quinta · 20:00 às 21:30",
    instructor: { id: "alessandro", name: "Alessandro" },
  },
];

const contato = {
  ...escola.contato,
  telefoneDisplay: "(65) 99276-7825",
  telefoneLink: "tel:+556592767825",
  whatsappDisplay: "(65) 99276-7825",
  whatsappLink: "https://wa.me/556592767825",
  endereco: "Rua Carandá, 211 — Alvorada, Cuiabá/MT",
  mapaLink:
    "https://www.google.com/maps/search/?api=1&query=Rua+Carand%C3%A1%2C+211+-+Alvorada%2C+Cuiab%C3%A1+-+MT",
};

/* --------------------------------- */

export default function Landing() {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero__inner">
          <span className="landing-hero__han" aria-hidden="true">
            {escola.han}
          </span>
          <p className="eyebrow">Arte marcial · Cuiabá/MT</p>
          <h1 className="landing-hero__title">{escola.nomeCurto}</h1>
          <p className="landing-hero__lead">{escola.slogan}</p>
          <div className="landing-hero__cta">
            <Link to="/cadastro" className="btn btn--red">
              Matricule-se
            </Link>
            <Link to="/login" className="btn btn--ghost">
              Entrar
            </Link>
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section className="landing-section">
        <div className="landing-section__inner">
          <h2 className="landing-section__title">Sobre a escola</h2>
          {escola.sobre.map((paragrafo) => (
            <p key={paragrafo.slice(0, 20)}>{paragrafo}</p>
          ))}
        </div>
      </section>

      {/* Turmas e horários */}
      <section className="landing-section landing-section--tint">
        <div className="landing-section__inner">
          <h2 className="landing-section__title">Turmas e horários</h2>
          <ul className="landing-classes">
            {turmas.map((turma) => (
              <li className="landing-class" key={turma.id}>
                <div>
                  <h3 className="landing-class__name">{turma.name}</h3>
                  {turma.description && (
                    <p className="muted">{turma.description}</p>
                  )}
                </div>
                <div className="landing-class__meta">
                  {turma.schedule && (
                    <span className="landing-class__schedule">
                      {turma.schedule}
                    </span>
                  )}
                  <span className="muted">
                    Instrutor: {turma.instructor.name}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Instrutores */}
      <section className="landing-section">
        <div className="landing-section__inner">
          <h2 className="landing-section__title">Instrutores</h2>
          <InstructorsGrid instructors={instrutores} />
        </div>
      </section>

      {/* Contato */}
      <section className="landing-section landing-section--tint">
        <div className="landing-section__inner">
          <h2 className="landing-section__title">Contato</h2>
          <ul className="landing-contact">
            <li>
              <a href={contato.telefoneLink} className="landing-contact__link">
                📞 {contato.telefoneDisplay}
              </a>
            </li>
            <li>
              <a
                href={contato.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="landing-contact__link"
              >
                💬 WhatsApp: {contato.whatsappDisplay}
              </a>
            </li>
            <li>
              <a
                href={contato.instagram}
                target="_blank"
                rel="noreferrer"
                className="landing-contact__link"
              >
                📷 Instagram: {contato.instagramDisplay}
              </a>
            </li>
            <li>
              <a
                href={contato.mapaLink}
                target="_blank"
                rel="noreferrer"
                className="landing-contact__link"
              >
                📍 {contato.endereco} (ver no mapa)
              </a>
            </li>
            <li>
              <a
                href={`mailto:${contato.email}`}
                className="landing-contact__link"
              >
                ✉️ {contato.email}
              </a>
            </li>
          </ul>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <span>
            © {new Date().getFullYear()} {escola.nomeCurto}
          </span>
          <nav className="landing-footer__social" aria-label="Redes sociais">
            <a href={contato.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href={contato.whatsappLink} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
