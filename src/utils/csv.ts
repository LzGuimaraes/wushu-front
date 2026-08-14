/** Exporta um array de objetos para CSV (UTF-8 com BOM para Excel/pt-BR). */

export function exportToCsv(
  filename: string,
  rows: Record<string, string | number | boolean | null | undefined>[],
): void {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    const text = String(value)
    return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const lines = [
    headers.join(';'),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(';')),
  ]
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
