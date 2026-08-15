import { PageHeader } from "../components/PageHeader";
import { Alert } from "../components/Alert";
import { escola, waLink } from "../config/escola";

interface Step {
  titulo: string;
  descricao: string;
}

const STEPS: Step[] = [
  {
    titulo: "Crie sua conta",
    descricao:
      "Cadastre-se com nome, e-mail e senha. Enviaremos um e-mail de confirmação para você validar o cadastro.",
  },
  {
    titulo: "Aguarde a aprovação",
    descricao:
      `O professor analisa seu cadastro em ${escola.prazos.aprovacao}. Enquanto isso, você vê a tela de "aguardando aprovação".`,
  },
  {
    titulo: "Complete seu cadastro",
    descricao:
      "No Meu portal, preencha seus dados (CPF, telefone, endereço, modalidade e objetivo). É assim que a secretaria gera sua matrícula.",
  },
  {
    titulo: "Acompanhe suas turmas",
    descricao:
      "Depois da matrícula, você vê em \"Minhas turmas\" os dias, horários e o instrutor de cada turma em que está matriculado.",
  },
  {
    titulo: "Acompanhe suas mensalidades",
    descricao:
      "Em \"Meus pagamentos\" você vê o valor, o vencimento e a situação de cada mês (aguardando pagamento, confirmado ou em atraso).",
  },
  {
    titulo: "Mantenha seu perfil atualizado",
    descricao:
      "Mudou de telefone ou endereço? Atualize em \"Meu perfil\". Assim a escola consegue falar com você e registrar as aulas corretamente.",
  },
];

export default function ComoFunciona() {
  return (
    <div>
      <PageHeader
        titulo="Como funciona"
        subtitle="Um passo a passo para você aproveitar o portal do aluno."
        backTo="/portal"
      />

      <Alert type="info">
        Dúvidas? Fale com a escola pelo WhatsApp — respondemos rapidinho.
      </Alert>

      <ol className="guide">
        {STEPS.map((step, index) => (
          <li className="guide__step card" key={step.titulo}>
            <span className="guide__number" aria-hidden="true">
              {index + 1}
            </span>
            <div className="guide__content">
              <h2>{step.titulo}</h2>
              <p>{step.descricao}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="card">
        <h2>Precisa de ajuda?</h2>
        <p className="muted">
          A escola fica em {escola.contato.endereco}. Você também pode chamar
          pelo WhatsApp ou pelo Instagram.
        </p>
        <div className="form-actions">
          <a
            href={waLink("Olá! Tenho uma dúvida sobre o portal do aluno. 🙂")}
            target="_blank"
            rel="noreferrer"
            className="btn btn--red"
          >
            Falar no WhatsApp
          </a>
          <a
            href={escola.contato.instagram}
            target="_blank"
            rel="noreferrer"
            className="btn btn--ghost"
          >
            {escola.contato.instagramDisplay}
          </a>
        </div>
      </div>
    </div>
  );
}
