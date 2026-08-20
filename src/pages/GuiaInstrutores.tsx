import { PageHeader } from "../components/PageHeader";
import { Alert } from "../components/Alert";

interface Item {
  titulo: string;
  descricao: string;
  /** Marca quem executa: admin, instrutor ou ambos. */
  quem: "admin" | "instrutor" | "ambos";
}

const QUEM_LABEL: Record<Item["quem"], string> = {
  admin: "Somente administrador",
  instrutor: "Instrutor",
  ambos: "Admin e instrutor",
};

const INSTRUTOR_FAZ: Item[] = [
  {
    titulo: "Enxergar só as próprias turmas",
    descricao:
      "Ao entrar, o instrutor vê o dashboard e as listas restritas às turmas em que é o instrutor. Ele não consegue ver alunos, matrículas ou pagamentos de turmas de outros professores — essa restrição é validada no servidor.",
    quem: "instrutor",
  },
  {
    titulo: "Acompanhar alunos em dia e não pagos",
    descricao:
      "No dashboard, o instrutor vê, por mês, quantos alunos das próprias turmas estão com pagamento em dia e quantos ainda não pagaram, além das mensalidades pendentes.",
    quem: "instrutor",
  },
  {
    titulo: "Confirmar pagamentos das próprias turmas",
    descricao:
      "Quando um aluno das turmas do instrutor paga a mensalidade, o instrutor pode confirmar o pagamento. Se tentar confirmar pagamento de outra turma, o sistema bloqueia.",
    quem: "instrutor",
  },
  {
    titulo: "Exportar listas em CSV",
    descricao:
      "O instrutor pode exportar as listas de alunos em dia / não pagos das próprias turmas para conferir fora do sistema.",
    quem: "instrutor",
  },
];

const ADMIN_FAZ: Item[] = [
  {
    titulo: "Aprovar ou rejeitar cadastros",
    descricao:
      "Somente o administrador aprova ou rejeita a conta do aluno. Depois disso, o aluno acessa o portal e preenche sua ficha médica e dados do responsável.",
    quem: "admin",
  },
  {
    titulo: "Acompanhar o processo sem preencher os dados do aluno",
    descricao:
      "O admin valida o status do aluno, mas não preenche o checklist do estudante. A responsabilidade da ficha técnica e dos responsáveis fica com o próprio aluno.",
    quem: "admin",
  },
  {
    titulo: "Criar turmas e vincular instrutores",
    descricao:
      "O administrador cria as turmas e indica quem é o instrutor responsável. Esse vínculo define o que cada instrutor consegue enxergar.",
    quem: "admin",
  },
  {
    titulo: "Lançar mensalidades e registrar frequência",
    descricao:
      "A criação de mensalidades, confirmação de pagamento e o registro de presença continuam sendo tarefas da gestão administrativa; o instrutor acompanha pelo painel restrito.",
    quem: "admin",
  },
];

function GuideSection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: Item[];
}) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <p className="muted">{subtitle}</p>
      <ul className="guide-list">
        {items.map((item) => (
          <li className="guide-list__item" key={item.titulo}>
            <div className="guide-list__head">
              <strong>{item.titulo}</strong>
              <span className={`badge badge--who badge--who-${item.quem}`}>
                {QUEM_LABEL[item.quem]}
              </span>
            </div>
            <p className="muted">{item.descricao}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function GuiaInstrutores() {
  return (
    <div>
      <PageHeader
        titulo="Como os instrutores usam o sistema"
        subtitle="Guia de operação da escola — leia antes de treinar a equipe."
        backTo="/admin"
      />

      <Alert type="info">
        Este guia é visível apenas para administradores. O acesso de cada
        instrutor é limitado às próprias turmas e essa regra é validada no
        servidor em todos os endpoints.
      </Alert>

      <section className="card">
        <h2>Quem é um instrutor no sistema?</h2>
        <p>
          Todo usuário que aparece como <strong>instrutor de uma turma</strong>{" "}
          passa a ter acesso ao painel. Para isso, no cadastro de turma
          (menu <em>Turmas</em>), selecione o professor responsável. A
          aprovação do aluno continua sendo feita pelo administrador.
        </p>
        <p className="muted">
          Dica: defina com antecedência quem leciona cada turma. O vínculo
          correto garante que cada instrutor veja só os alunos da sua turma.
        </p>
      </section>

      <GuideSection
        title="O que o instrutor consegue fazer"
        subtitle="O acesso dele é restrito às turmas em que é o instrutor."
        items={INSTRUTOR_FAZ}
      />

      <GuideSection
        title="O que só o administrador faz"
        subtitle="Aprovação de cadastros e operação de secretaria ficam com o admin."
        items={ADMIN_FAZ}
      />

      <section className="card">
        <h2>Fluxo recomendado no dia a dia</h2>
        <ol className="guide">
          <li className="guide__step" style={{ padding: "14px 16px" }}>
            <span className="guide__number" aria-hidden="true">
              1
            </span>
            <div className="guide__content">
              <p>
                <strong>Cadastro:</strong> o aluno cria a conta e aguarda a
                aprovação do administrador.
              </p>
            </div>
          </li>
          <li className="guide__step" style={{ padding: "14px 16px" }}>
            <span className="guide__number" aria-hidden="true">
              2
            </span>
            <div className="guide__content">
              <p>
                <strong>Checklist do aluno:</strong> após a aprovação, o próprio
                aluno preenche a ficha médica e os dados do responsável no portal.
              </p>
            </div>
          </li>
          <li className="guide__step" style={{ padding: "14px 16px" }}>
            <span className="guide__number" aria-hidden="true">
              3
            </span>
            <div className="guide__content">
              <p>
                <strong>Administração:</strong> o admin acompanha status,
                confirma pagamentos e organiza turmas sem assumir o preenchimento
                da ficha do aluno.
              </p>
            </div>
          </li>
          <li className="guide__step" style={{ padding: "14px 16px" }}>
            <span className="guide__number" aria-hidden="true">
              4
            </span>
            <div className="guide__content">
              <p>
                <strong>Turmas e mensalidades:</strong> o instrutor acompanha a
                turma e a gestão fecha mensalidades e frequência conforme o
                processo da escola.
              </p>
            </div>
          </li>
        </ol>
      </section>
    </div>
  );
}
