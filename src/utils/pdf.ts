import jsPDF from 'jspdf'

export function exportPendingRegistrationsPdf(
  filename: string,
  rows: Array<Record<string, any>>,
  month: string,
) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  doc.setFontSize(14)
  doc.text(`Cadastros pendentes — ${month}`, 40, 40)
  doc.setFontSize(10)

  let y = 64
  for (const row of rows) {
    const line = `${row.name} — ${row.email} — ${row.studentProfile?.phone ?? ''} — ${new Date(
      row.createdAt,
    ).toLocaleDateString()}`
    doc.text(line, 40, y, { maxWidth: 515 })
    y += 16
    if (y > 750) {
      doc.addPage()
      y = 40
    }
  }

  doc.save(filename)
}

export default exportPendingRegistrationsPdf
