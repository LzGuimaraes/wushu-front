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
    titulo: "Aprovar cadastros de alunos",
    descricao:
      "Somente o administrador aprova ou rejeita os cadastros que aguardam na fila de aprovação (a conta só é liberada depois disso).",
    quem: "admin",
  },
  {
    titulo: "Criar turmas e vincular instrutores",
    descricao:
      "O administrador cria as turmas e indica quem é o instrutor de cada uma. É esse vínculo que define o que cada instrutor consegue enxergar.",
    quem: "admin",
  },
  {
    titulo: "Criar matrículas e vincular alunos às turmas",
    descricao:
      "Matrículas, números de matrícula e a vinculação aluno → turma são feitas pelo administrador na secretaria.",
    quem: "admin",
  },
  {
    titulo: "Lançar mensalidades e registrar frequência",
    descricao:
      "A criação de mensalidades e o registro de presença são feitos pelo administrador; o instrutor acompanha pelo painel dele.",
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
          (menu <em>Turmas</em>), selecione o professor responsável. Se a
          pessoa não tiver conta ainda, crie uma em <em>Alunos</em> e depois a
          vincule como instrutor da turma.
        </p>
        <p className="muted">
          Dica: defina com antecedência quem leciona cada turma. O vínculo
          correto garante que cada instrutor veja só os alunos dele.
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
                <strong>Manhã:</strong> o admin confere a fila de aprovação e
                libera os cadastros novos.
              </p>
            </div>
          </li>
          <li className="guide__step" style={{ padding: "14px 16px" }}>
            <span className="guide__number" aria-hidden="true">
              2
            </span>
            <div className="guide__content">
              <p>
                <strong>Antes da aula:</strong> o admin registra a frequência
                da turma ou o instrutor acompanha a lista no painel.
              </p>
            </div>
          </li>
          <li className="guide__step" style={{ padding: "14px 16px" }}>
            <span className="guide__number" aria-hidden="true">
              3
            </span>
            <div className="guide__content">
              <p>
                <strong>Ao receber pagamento:</strong> o instrutor confirma a
                mensalidade dos alunos das próprias turmas; o admin pode
                confirmar qualquer uma.
              </p>
            </div>
          </li>
          <li className="guide__step" style={{ padding: "14px 16px" }}>
            <span className="guide__number" aria-hidden="true">
              4
            </span>
            <div className="guide__content">
              <p>
                <strong>Fim do mês:</strong> confira os cards de "em dia" e
                "não pagos" e exporte o CSV para cobrança.
              </p>
            </div>
          </li>
        </ol>
      </section>
    </div>
  );
}
