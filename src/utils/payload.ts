/**
 * Monta o corpo da requisição descartando campos vazios.
 * O backend usa `forbidNonWhitelisted` e campos opcionais precisam ser
 * omitidos — enviar string vazia grava lixo no banco.
 */
export function buildPayload(
  entries: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "") continue;
      payload[key] = trimmed;
      continue;
    }
    payload[key] = value;
  }
  return payload;
}
