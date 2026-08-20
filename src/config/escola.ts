/**
 * Configuração única da escola — dados de contato e textos da landing page.
 * Altere aqui (ou via variável de ambiente VITE_ESCOLA_*) e tudo se atualiza.
 * Não espalhe esses valores hardcoded pelos componentes.
 */

const whatsappNumber = import.meta.env.VITE_ESCOLA_WHATSAPP ?? '556593004631'
const phoneNumber = import.meta.env.VITE_ESCOLA_PHONE ?? '(65) 9300-4631'

/** Formata dígitos (55 + DDD + número, 8 ou 9 dígitos) para (DD) NNNNN-NNNN. */
function maskWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  // Remove o código do país (55) quando presente.
  const local = digits.length > 10 ? digits.slice(2) : digits
  if (local.length < 10) return raw
  const split = local.length > 10 ? 5 : 4
  return `(${local.slice(0, 2)}) ${local.slice(2, 2 + split)}-${local.slice(2 + split)}`
}

export const escola = {
  nome: 'Kung Fu Manager',
  nomeCurto: 'Kung Fu Cuiabá',
  han: '功夫',
  slogan: 'Disciplina, respeito e força interior.',
  sobre: [
    'O Kung Fu é uma arte marcial milenar que desenvolve corpo e mente: condicionamento físico, defesa pessoal, equilíbrio e disciplina.',
    'Aqui você treina no seu ritmo, com professores experientes e uma comunidade acolhedora. Venha conhecer!',
  ],
  contato: {
    telefoneDisplay: phoneNumber,
    telefoneLink: `tel:+${phoneNumber.replace(/\D/g, '')}`,
    whatsappDisplay: maskWhatsapp(whatsappNumber),
    whatsappLink: `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
      'Olá! Quero saber mais sobre as aulas de Kung Fu. 🥋',
    )}`,
    instagram: 'https://instagram.com/kungfucuiaba',
    instagramDisplay: '@kungfucuiaba',
    email: import.meta.env.VITE_ESCOLA_EMAIL ?? 'contato@kungfucuiaba.com.br',
    endereco: 'Rua Exemplo, 123 — Centro, Cuiabá/MT',
    mapaLink:
      'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent('Cuiabá, MT'),
  },
  prazos: {
    aprovacao: 'até 48 horas úteis',
  },
}

export const waLink = (message: string): string =>
  `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
