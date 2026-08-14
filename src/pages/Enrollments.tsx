import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  approveEnrollment,
  createEnrollment,
  deleteEnrollment,
  listEnrollments,
} from '../api'
import type { Enrollment } from '../types'

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  ACTIVE: 'Ativa',
  CANCELLED: 'Cancelada',
  FINISHED: 'Concluída',
}

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<Record<string, string>>({})

  const load = () => {
    listEnrollments()
      .then((r) => setEnrollments(r.data))
      .catch(() => setError('Erro ao carregar matrículas'))
  }

  useEffect(load, [])

  const set =
    (key: string) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await createEnrollment({
        studentId: form.studentId,
        enrollmentNumber: form.enrollmentNumber,
        registrationDate: form.registrationDate,
      })
      setForm({})
      setShowForm(false)
      load()
    } catch {
      setError('Erro ao criar matrícula')
    }
  }

  const approve = async (id: string) => {
    try {
      await approveEnrollment(id)
      load()
    } catch {
      setError('Erro ao aprovar matrícula')
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Excluir matrícula?')) return
    await deleteEnrollment(id)
    load()
  }

  return (
    <div>
      <div className="flex-between">
        <h1>Matrículas</h1>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Fechar' : 'Nova matrícula'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {showForm && (
        <form className="card" onSubmit={submit}>
          <h2>Nova matrícula</h2>
          <div className="grid-2">
            <label>
              ID do aluno (StudentProfile)
              <input value={form.studentId ?? ''} onChange={set('studentId')} required />
            </label>
            <label>
              Número da matrícula
              <input
                value={form.enrollmentNumber ?? ''}
                onChange={set('enrollmentNumber')}
                required
              />
            </label>
            <label>
              Data de registro
              <input
                type="date"
                value={form.registrationDate ?? ''}
                onChange={set('registrationDate')}
                required
              />
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
              <th>Número</th>
              <th>Status</th>
              <th>Registro</th>
              <th>Ações</th>
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
                <td>
                  {e.status === 'PENDING' && (
                    <button className="btn-success btn-sm" onClick={() => approve(e.id)}>
                      Aprovar
                    </button>
                  )}
                  <button className="btn-danger btn-sm" onClick={() => remove(e.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {enrollments.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  Nenhuma matrícula.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
