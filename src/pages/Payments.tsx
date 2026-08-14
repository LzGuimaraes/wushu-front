import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  confirmPayment,
  createPayment,
  deletePayment,
  listPayments,
} from '../api'
import type { Payment } from '../types'

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
}

const methodLabels: Record<string, string> = {
  PIX: 'PIX',
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Crédito',
  DEBIT_CARD: 'Débito',
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<Record<string, string>>({
    paymentMethod: 'PIX',
  })

  const load = () => {
    listPayments()
      .then((r) => setPayments(r.data))
      .catch(() => setError('Erro ao carregar pagamentos'))
  }

  useEffect(load, [])

  const set =
    (key: string) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await createPayment({
        enrollmentId: form.enrollmentId,
        amount: Number(form.amount),
        competence: form.competence,
        dueDate: form.dueDate,
        paymentMethod: form.paymentMethod,
      })
      setForm({ paymentMethod: 'PIX' })
      setShowForm(false)
      load()
    } catch {
      setError('Erro ao criar pagamento')
    }
  }

  const confirm = async (id: string) => {
    await confirmPayment(id)
    load()
  }

  const remove = async (id: string) => {
    if (!window.confirm('Excluir pagamento?')) return
    await deletePayment(id)
    load()
  }

  return (
    <div>
      <div className="flex-between">
        <h1>Pagamentos</h1>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Fechar' : 'Novo pagamento'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {showForm && (
        <form className="card" onSubmit={submit}>
          <h2>Novo pagamento</h2>
          <div className="grid-2">
            <label>
              ID da matrícula
              <input
                value={form.enrollmentId ?? ''}
                onChange={set('enrollmentId')}
                required
              />
            </label>
            <label>
              Valor
              <input
                type="number"
                step="0.01"
                value={form.amount ?? ''}
                onChange={set('amount')}
                required
              />
            </label>
            <label>
              Competência (mês)
              <input
                type="date"
                value={form.competence ?? ''}
                onChange={set('competence')}
                required
              />
            </label>
            <label>
              Vencimento
              <input
                type="date"
                value={form.dueDate ?? ''}
                onChange={set('dueDate')}
                required
              />
            </label>
            <label>
              Método
              <select
                value={form.paymentMethod ?? 'PIX'}
                onChange={set('paymentMethod')}
              >
                <option value="PIX">PIX</option>
                <option value="CASH">Dinheiro</option>
                <option value="CREDIT_CARD">Crédito</option>
                <option value="DEBIT_CARD">Débito</option>
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button className="btn-primary" type="submit">
              Salvar
            </button>
          </div>
        </form>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Método</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>R$ {Number(p.amount).toFixed(2)}</td>
                <td>{p.dueDate.slice(0, 10)}</td>
                <td>{methodLabels[p.paymentMethod] ?? p.paymentMethod}</td>
                <td>
                  <span className={`badge badge-${p.status.toLowerCase()}`}>
                    {statusLabels[p.status] ?? p.status}
                  </span>
                </td>
                <td>
                  {p.status !== 'PAID' && (
                    <button className="btn-success btn-sm" onClick={() => confirm(p.id)}>
                      Confirmar
                    </button>
                  )}
                  <button className="btn-danger btn-sm" onClick={() => remove(p.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  Nenhum pagamento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
