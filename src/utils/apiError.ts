/**
 * Traduz os erros da API (NestJS + class-validator) para mensagens em pt-BR.
 * O backend responde `{ statusCode, message }`, onde `message` é uma string
 * ou a lista de erros de validação — sempre em inglês.
 */

interface ApiErrorLike {
  response?: {
    status?: number;
    data?: { message?: string | string[]; error?: string };
  };
  request?: unknown;
  code?: string;
  message?: string;
}

/** Rótulos dos campos usados nas mensagens de erro do servidor. */
const FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  email: "E-mail",
  password: "Senha",
  userId: "Usuário",
  studentId: "Aluno",
  studentProfileId: "Aluno",
  instructorId: "Instrutor",
  enrollmentId: "Matrícula",
  classId: "Turma",
  enrollmentNumber: "Número da matrícula",
  cpf: "CPF",
  phone: "Telefone",
  responsiblePhone: "Telefone do responsável",
  emergencyContact: "Contato de emergência",
  birthDate: "Data de nascimento",
  address: "Endereço",
  district: "Bairro",
  city: "Cidade",
  zipCode: "CEP",
  belt: "Faixa",
  trainingModality: "Modalidade",
  goal: "Objetivo",
  goalDescription: "Descrição do objetivo",
  registrationDate: "Data de registro",
  startDate: "Data de início",
  endDate: "Data de término",
  attendanceDate: "Data",
  graduationDate: "Data de graduação",
  competence: "Competência",
  dueDate: "Vencimento",
  paymentDate: "Data de pagamento",
  paymentMethod: "Forma de pagamento",
  amount: "Valor",
  status: "Situação",
  schedule: "Horário",
  description: "Descrição",
  notes: "Observações",
  present: "Presença",
};

const RULES: {
  pattern: RegExp;
  message: (match: RegExpMatchArray) => string;
}[] = [
  { pattern: /must be an email$/, message: () => "deve ser um e-mail válido" },
  { pattern: /should not be empty$/, message: () => "é obrigatório" },
  { pattern: /must be a string$/, message: () => "deve ser um texto" },
  {
    pattern: /must be a UUID$/,
    message: () => "não foi selecionado corretamente",
  },
  { pattern: /must be a boolean value$/, message: () => "deve ser sim ou não" },
  {
    pattern: /must be a Date instance$/,
    message: () => "deve ser uma data válida",
  },
  {
    pattern: /must be longer than or equal to (\d+) characters$/,
    message: (m) => `deve ter no mínimo ${m[1]} caracteres`,
  },
  {
    pattern: /must be shorter than or equal to (\d+) characters$/,
    message: (m) => `deve ter no máximo ${m[1]} caracteres`,
  },
  {
    pattern: /must not be less than (\d+)$/,
    message: (m) => `não pode ser menor que ${m[1]}`,
  },
  {
    pattern: /must not be greater than (\d+)$/,
    message: (m) => `não pode ser maior que ${m[1]}`,
  },
  {
    pattern: /must be a number conforming to the specified constraints$/,
    message: () => "deve ser um número válido (use até 2 casas decimais)",
  },
  {
    pattern: /must be one of the following values: .+$/,
    message: () => "tem um valor não permitido",
  },
];

const STATUS_MESSAGES: Record<number, string> = {
  400: "Confira os dados enviados.",
  401: "Sessão expirada. Entre novamente.",
  403: "Você não tem permissão para esta ação.",
  404: "Registro não encontrado.",
  409: "Já existe um registro com esses dados.",
  422: "Confira os dados enviados.",
  500: "Erro interno do servidor. Tente novamente em instantes.",
};

const asApiError = (error: unknown): ApiErrorLike =>
  typeof error === "object" && error !== null ? (error as ApiErrorLike) : {};

const messageList = (error: unknown): string[] => {
  const raw = asApiError(error).response?.data?.message;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) return [raw];
  return [];
};

/** "cpf must be shorter than..." -> { field: 'cpf', message: 'CPF deve ter no máximo...' } */
function parseValidationMessage(raw: string): {
  field?: string;
  message: string;
} {
  const propertyMatch = raw.match(/^property (\w+) should not exist$/);
  if (propertyMatch) {
    const label = FIELD_LABELS[propertyMatch[1]] ?? propertyMatch[1];
    return {
      field: propertyMatch[1],
      message: `${label} não é aceito neste formulário`,
    };
  }

  const [field, ...rest] = raw.split(" ");
  const tail = rest.join(" ");
  const known = FIELD_LABELS[field];

  for (const rule of RULES) {
    const match = tail.match(rule.pattern);
    if (match) {
      const label = known ?? field;
      return { field, message: `${label} ${rule.message(match)}` };
    }
  }

  // Mensagem já em português (lançada pelos services) ou desconhecida.
  return known ? { field, message: `${known}: ${tail}` } : { message: raw };
}

/** Erros de validação por campo, prontos para exibir abaixo de cada input. */
export function getApiFieldErrors(error: unknown): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const raw of messageList(error)) {
    const parsed = parseValidationMessage(raw);
    if (parsed.field && !fieldErrors[parsed.field]) {
      fieldErrors[parsed.field] = parsed.message;
    }
  }
  return fieldErrors;
}

/**
 * Mensagem única para o alerta do formulário.
 * `overrides` permite trocar o texto de status específicos (ex.: 409).
 */
export function getApiErrorMessage(
  error: unknown,
  fallback: string,
  overrides: Partial<Record<number, string>> = {},
): string {
  const apiError = asApiError(error);
  const status = apiError.response?.status;

  if (status && overrides[status]) return overrides[status] as string;

  if (!apiError.response) {
    // Sem resposta: servidor fora do ar, CORS ou rede indisponível.
    if (apiError.request || apiError.code === "ERR_NETWORK") {
      return "Não foi possível falar com o servidor. Verifique sua conexão e tente novamente.";
    }
    return fallback;
  }

  const messages = messageList(error);
  if (messages.length > 0) {
    const translated = messages.map(
      (raw) => parseValidationMessage(raw).message,
    );
    // "Registro duplicado" e afins já vêm em português e não precisam de contexto.
    return translated.length === 1 ? translated[0] : translated.join(" · ");
  }

  return (
    (status !== undefined ? STATUS_MESSAGES[status] : undefined) ?? fallback
  );
}
