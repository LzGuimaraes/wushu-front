import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  addStudentToClass,
  createClass,
  deleteClass,
  listClasses,
  listClassStudents,
  removeStudentFromClass,
} from '../api'
import type { ClassEntity, StudentClass } from '../types'

export default function Classes() {
  const [classes, setClasses] = useState<ClassEntity[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [students, setStudents] = useState<StudentClass[]>([])
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<Record<string, string>>({})
  const [enrollmentId, setEnrollmentId] = useState('')

  const loadClasses = () => {
    listClasses()
      .then((r) => setClasses(r.data))
      .catch(() => setError('Erro ao carregar turmas'))
  }

  useEffect(loadClasses, [])

  const loadStudents = (classId: string) => {
    listClassStudents(classId)
      .then((r) => setStudents(r.data))
      .catch(() => setStudents([]))
  }

  const selectClass = (id: string) => {
    setSelectedId(id)
    setEnrollmentId('')
    loadStudents(id)
  }

  const set =
    (key: string) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const payload: Record<string, unknown> = {
      instructorId: form.instructorId,
      name: form.name,
    }
    if (form.description) payload.description = form.description
    if (form.schedule) payload.schedule = form.schedule
    try {
      await createClass(payload)
      setForm({})
      setShowForm(false)
      loadClasses()
    } catch {
      setError('Erro ao criar turma')
    }
  }

  const addStudent = async () => {
    if (!selectedId || !enrollmentId) return
    try {
      await addStudentToClass(selectedId, enrollmentId)
      setEnrollmentId('')
      loadStudents(selectedId)
    } catch {
      setError('Erro ao adicionar aluno')
    }
  }

  const removeStudent = async (enrId: string) => {
    if (!selectedId) return
    await removeStudentFromClass(selectedId, enrId)
    loadStudents(selectedId)
  }

  const removeClass = async (id: string) => {
    if (!window.confirm('Excluir turma?')) return
    await deleteClass(id)
    if (selectedId === id) {
      setSelectedId(null)
      setStudents([])
    }
    loadClasses()
  }

  return (
    <div>
      <div className="flex-between">
        <h1>Turmas</h1>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Fechar' : 'Nova turma'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {showForm && (
        <form className="card" onSubmit={submit}>
          <h2>Nova turma</h2>
          <div className="grid-2">
            <label>
              ID do instrutor (usuário)
              <input
                value={form.instructorId ?? ''}
                onChange={set('instructorId')}
                required
              />
            </label>
            <label>
              Nome
              <input value={form.name ?? ''} onChange={set('name')} required />
            </label>
            <label>
              Horário
              <input value={form.schedule ?? ''} onChange={set('schedule')} />
            </label>
            <label>
              Descrição
              <input value={form.description ?? ''} onChange={set('description')} />
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
              <th>Nome</th>
              <th>Horário</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.schedule ?? '-'}</td>
                <td>
                  <button className="btn btn-sm" onClick={() => selectClass(c.id)}>
                    Alunos
                  </button>
                  <button className="btn-danger btn-sm" onClick={() => removeClass(c.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan={3} className="muted">
                  Nenhuma turma.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedId && (
        <div className="card">
          <h2>Alunos da turma</h2>
          <label style={{ maxWidth: 420 }}>
            ID da matrícula
            <input
              value={enrollmentId}
              onChange={(e) => setEnrollmentId(e.target.value)}
            />
          </label>
          <div className="form-actions">
            <button className="btn-primary" onClick={addStudent}>
              Adicionar aluno
            </button>
          </div>
          <ul>
            {students.map((s) => (
              <li key={s.id}>
                Matrícula: {s.enrollmentId}{' '}
                <button
                  className="btn-danger btn-sm"
                  onClick={() => removeStudent(s.enrollmentId)}
                >
                  Remover
                </button>
              </li>
            ))}
            {students.length === 0 && (
              <li className="muted">Nenhum aluno nesta turma.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
