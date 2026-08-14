import { useEffect, useState } from 'react'
import { listClasses, listEnrollments, listPayments, listStudents } from '../api'
import type {
  ClassEntity,
  Enrollment,
  Payment,
  StudentProfile,
} from '../types'

export default function Dashboard() {
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [classes, setClasses] = useState<ClassEntity[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    Promise.all([listStudents(), listEnrollments(), listClasses(), listPayments()])
      .then(([s, e, c, p]) => {
        setStudents(s.data)
        setEnrollments(e.data)
        setClasses(c.data)
        setPayments(p.data)
      })
      .catch(() => {
        /* ignora erros de carregamento */
      })
  }, [])

  const pendingEnrollments = enrollments.filter((e) => e.status === 'PENDING').length
  const pendingPayments = payments.filter((p) => p.status === 'PENDING').length
  const overduePayments = payments.filter((p) => p.status === 'OVERDUE').length
  const revenue = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="cards">
        <div className="stat-card">
          <strong>{students.length}</strong>
          <span>Alunos cadastrados</span>
        </div>
        <div className="stat-card">
          <strong>{pendingEnrollments}</strong>
          <span>Matrículas pendentes</span>
        </div>
        <div className="stat-card">
          <strong>{classes.length}</strong>
          <span>Turmas</span>
        </div>
        <div className="stat-card">
          <strong>{pendingPayments}</strong>
          <span>Pagamentos pendentes</span>
        </div>
        <div className="stat-card">
          <strong>{overduePayments}</strong>
          <span>Pagamentos vencidos</span>
        </div>
        <div className="stat-card">
          <strong>R$ {revenue.toFixed(2)}</strong>
          <span>Receita (pagos)</span>
        </div>
      </div>
    </div>
  )
}
