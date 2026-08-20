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
      "Cadastre-se com nome, e-mail e senha. Enviaremos um e-mail de confirmação — aguarde até a aprovação do instrutor ou do administrador.",
  },
  {
    titulo: "Aguarde a aprovação",
    descricao:
      `O instrutor ou o administrador aprova seu cadastro em ${escola.prazos.aprovacao}. Enquanto isso você permanece na tela de \"Aguardando aprovação\".`,
  },
  {
    titulo: "Complete seu cadastro",
    descricao:
      "No Meu Portal, preencha seus dados (CPF, telefone, endereço, modalidade e objetivo). Após a aprovação, a secretaria ou o instrutor cria sua matrícula.",
  },
  {
    titulo: "Acompanhe suas turmas",
    descricao:
      "Em \"Minhas turmas\" você vê dias, horários e o instrutor. Instrutores só veem e gerenciam turmas vinculadas a si mesmos; administradores veem a escola inteira.",
  },
  {
    titulo: "Acompanhe suas mensalidades",
    descricao:
      "Em \"Meus pagamentos\" você vê valor, vencimento e situação (Pendente, Pago, Atrasado). O sistema gera uma mensalidade pendente automaticamente todo mês para cada matrícula ativa; instrutores e administradores podem ajustar valores e confirmar recebimentos.",
  },
  {
    titulo: "Mantenha seu perfil atualizado",
    descricao:
      "Mudou de telefone ou endereço? Atualize em \"Meu perfil\". Assim a escola consegue contatar você e registrar presenças corretamente.",
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
        <div className="card">
          <h2>Fluxograma do funcionamento</h2>
          <p className="muted">
            Abaixo está o fluxo principal do sistema: o aluno se cadastra, a
            escola aprova, o aluno completa a documentação e o administrador
            acompanha sem preencher os dados do aluno.
          </p>
          <pre className="code-block">
  {`flowchart LR
    A[Aluno faz cadastro] --> B[Admin aprova a conta]
    B --> C[Aluno acessa o portal]
    C --> D[Aluno preenche perfil e ficha médica]
    D --> E[Aluno informa responsável]
    E --> F[Admin acompanha o processo]
    F --> G[Aluno participa das turmas]
    G --> H[Mensalidades e pagamentos]

    I[Admin] -->|aprovacao| B
    J[Aluno] -->|preenche dados| D
    K[Escola] -->|acompanha| F
  `}
          </pre>
        </div>
      </div>
    </div>
  );
}
