import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  createAttendance,
  deleteAttendance,
  listAttendanceByClass,
  listClasses,
  updateAttendance,
} from '../api'
import type { Attendance, ClassEntity } from '../types'

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassEntity[]>([])
  const [classId, setClassId] = useState('')
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState<Record<string, string>>({ present: 'true' })

  useEffect(() => {
    listClasses()
      .then((r) => setClasses(r.data))
      .catch(() => setError('Erro ao carregar turmas'))
  }, [])

  const load = (cid: string) => {
    if (!cid) {
      setAttendance([])
      return
    }
    listAttendanceByClass(cid)
      .then((r) => setAttendance(r.data))
      .catch(() => setAttendance([]))
  }

  const set =
    (key: string) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await createAttendance({
        enrollmentId: form.enrollmentId,
        classId: form.classId,
        attendanceDate: form.attendanceDate,
        present: form.present === 'true',
      })
      setForm({ present: 'true' })
      if (form.classId === classId) load(classId)
    } catch {
      setError('Erro ao registrar presença')
    }
  }

  const toggle = async (a: Attendance) => {
    try {
      await updateAttendance(a.id, { present: !a.present })
      load(classId)
    } catch {
      setError('Erro ao atualizar presença')
    }
  }

  const remove = async (id: string) => {
    await deleteAttendance(id)
    load(classId)
  }

  return (
    <div>
      <h1>Frequência</h1>
      {error && <p className="error">{error}</p>}

      <form className="card" onSubmit={submit}>
        <h2>Registrar presença</h2>
        <div className="grid-2">
          <label>
            Turma
            <select value={form.classId ?? ''} onChange={set('classId')} required>
              <option value="">Selecione</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            ID da matrícula
            <input
              value={form.enrollmentId ?? ''}
              onChange={set('enrollmentId')}
              required
            />
          </label>
          <label>
            Data
            <input
              type="date"
              value={form.attendanceDate ?? ''}
              onChange={set('attendanceDate')}
              required
            />
          </label>
          <label>
            Presença
            <select value={form.present ?? 'true'} onChange={set('present')}>
              <option value="true">Presente</option>
              <option value="false">Ausente</option>
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button className="btn-primary" type="submit">
            Registrar
          </button>
        </div>
      </form>

      <div className="card">
        <div className="flex-between">
          <h2>Chamada por turma</h2>
          <select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value)
              load(e.target.value)
            }}
          >
            <option value="">Selecione uma turma</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Matrícula</th>
              <th>Presença</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((a) => (
              <tr key={a.id}>
                <td>{a.attendanceDate.slice(0, 10)}</td>
                <td>{a.enrollmentId}</td>
                <td>
                  <span className={`badge ${a.present ? 'badge-paid' : 'badge-cancelled'}`}>
                    {a.present ? 'Presente' : 'Ausente'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm" onClick={() => toggle(a)}>
                    Alternar
                  </button>
                  <button className="btn-danger btn-sm" onClick={() => remove(a.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {attendance.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  Nenhum registro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
