import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createStudent, deleteStudent, listStudents } from '../api'
import type { StudentProfile } from '../types'

const emptyForm: Record<string, string> = { goal: 'FITNESS' }

export default function Students() {
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<Record<string, string>>(emptyForm)

  const load = () => {
    listStudents()
      .then((r) => setStudents(r.data))
      .catch(() => setError('Erro ao carregar alunos'))
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
      userId: form.userId,
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
    if (form.belt) payload.belt = form.belt
    if (form.responsiblePhone) payload.responsiblePhone = form.responsiblePhone
    if (form.emergencyContact) payload.emergencyContact = form.emergencyContact
    try {
      await createStudent(payload)
      setForm(emptyForm)
      setShowForm(false)
      load()
    } catch {
      setError('Erro ao criar aluno')
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Excluir aluno?')) return
    try {
      await deleteStudent(id)
      load()
    } catch {
      setError('Erro ao excluir aluno')
    }
  }

  return (
    <div>
      <div className="flex-between">
        <h1>Alunos</h1>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Fechar' : 'Novo aluno'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {showForm && (
        <form className="card" onSubmit={submit}>
          <h2>Novo aluno</h2>
          <div className="grid-2">
            <label>
              ID do usuário (UUID)
              <input value={form.userId ?? ''} onChange={set('userId')} required />
            </label>
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
            <label>
              Faixa
              <input value={form.belt ?? ''} onChange={set('belt')} />
            </label>
            <label>
              Telefone do responsável
              <input
                value={form.responsiblePhone ?? ''}
                onChange={set('responsiblePhone')}
              />
            </label>
            <label>
              Contato de emergência
              <input
                value={form.emergencyContact ?? ''}
                onChange={set('emergencyContact')}
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
              <th>CPF</th>
              <th>Cidade</th>
              <th>Modalidade</th>
              <th>Objetivo</th>
              <th>Faixa</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.cpf}</td>
                <td>{s.city}</td>
                <td>{s.trainingModality}</td>
                <td>{s.goal}</td>
                <td>{s.belt ?? '-'}</td>
                <td>
                  <Link className="btn btn-sm" to={`/students/${s.id}`}>
                    Abrir
                  </Link>
                  <button className="btn-danger btn-sm" onClick={() => remove(s.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  Nenhum aluno cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
