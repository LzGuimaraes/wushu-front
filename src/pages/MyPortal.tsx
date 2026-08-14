import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  completeMyProfile,
  getMyEnrollments,
  getMyPayments,
  getMyProfile,
} from '../api'
import type { Enrollment, Payment, StudentProfile } from '../types'

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  ACTIVE: 'Ativa',
  CANCELLED: 'Cancelada',
  FINISHED: 'Concluída',
}

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
}

export default function MyPortal() {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState<Record<string, string>>({ goal: 'FITNESS' })

  const load = () => {
    getMyProfile()
      .then((r) => setProfile(r.data))
      .catch(() => setProfile(null))
    getMyEnrollments()
      .then((r) => setEnrollments(r.data))
      .catch(() => setEnrollments([]))
    getMyPayments()
      .then((r) => setPayments(r.data))
      .catch(() => setPayments([]))
  }

  useEffect(load, [])

  const set =
    (key: string) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const payload: Record<string, unknown> = {
      cpf: form.cpf,
      phone: form.phone,
      address: form.address,
      district: form.district,
      city: form.city,
      zipCode: form.zipCode,
      trainingModality: form.trainingModality,
      goal: form.goal,
    }
    if (form.birthDate) payload.birthDate = form.birthDate
    try {
      await completeMyProfile(payload)
      load()
    } catch {
      setError('Erro ao salvar perfil')
    }
  }

  return (
    <div>
      <h1>Meu Portal</h1>
      {error && <p className="error">{error}</p>}

      {!profile ? (
        <form className="card" onSubmit={submit}>
          <h2>Complete seu cadastro</h2>
          <div className="grid-2">
            <label>
              CPF
              <input value={form.cpf ?? ''} onChange={set('cpf')} required />
            </label>
            <label>
              Telefone
              <input value={form.phone ?? ''} onChange={set('phone')} required />
            </label>
            <label>
              Data de nascimento
              <input
                type="date"
                value={form.birthDate ?? ''}
                onChange={set('birthDate')}
              />
            </label>
            <label>
              Endereço
              <input value={form.address ?? ''} onChange={set('address')} required />
            </label>
            <label>
              Bairro
              <input value={form.district ?? ''} onChange={set('district')} required />
            </label>
            <label>
              Cidade
              <input value={form.city ?? ''} onChange={set('city')} required />
            </label>
            <label>
              CEP
              <input value={form.zipCode ?? ''} onChange={set('zipCode')} required />
            </label>
            <label>
              Modalidade
              <input
                value={form.trainingModality ?? ''}
                onChange={set('trainingModality')}
                required
              />
            </label>
            <label>
              Objetivo
              <select value={form.goal ?? 'FITNESS'} onChange={set('goal')}>
                <option value="FITNESS">Fitness</option>
                <option value="COMPETITION">Competição</option>
                <option value="SELF_DEFENSE">Defesa pessoal</option>
                <option value="LEISURE">Lazer</option>
                <option value="OTHER">Outro</option>
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button className="btn-primary" type="submit">
              Salvar
            </button>
          </div>
        </form>
      ) : (
        <div className="card">
          <h2>Meus dados</h2>
          <p>
            <strong>CPF:</strong> {profile.cpf} · <strong>Faixa:</strong>{' '}
            {profile.belt ?? '-'}
          </p>
          <p>
            <strong>Modalidade:</strong> {profile.trainingModality}
          </p>
        </div>
      )}

      <div className="card">
        <h2>Minhas matrículas</h2>
        <table>
          <thead>
            <tr>
              <th>Número</th>
              <th>Status</th>
              <th>Registro</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <tr key={e.id}>
                <td>{e.enrollmentNumber}</td>
                <td>
                  <span className={`badge badge-${e.status.toLowerCase()}`}>
                    {statusLabels[e.status] ?? e.status}
                  </span>
                </td>
                <td>{e.registrationDate?.slice(0, 10)}</td>
              </tr>
            ))}
            {enrollments.length === 0 && (
              <tr>
                <td colSpan={3} className="muted">
                  Nenhuma matrícula.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Meus pagamentos</h2>
        <table>
          <thead>
            <tr>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>R$ {Number(p.amount).toFixed(2)}</td>
                <td>{p.dueDate.slice(0, 10)}</td>
                <td>
                  <span className={`badge badge-${p.status.toLowerCase()}`}>
                    {paymentStatusLabels[p.status] ?? p.status}
                  </span>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={3} className="muted">
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
