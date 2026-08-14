import api from './client'
import type {
  Attendance,
  BeltHistory,
  ClassEntity,
  Enrollment,
  Guardian,
  MedicalRecord,
  Payment,
  StudentClass,
  StudentProfile,
  User,
} from '../types'

// Auth
export const login = (email: string, password: string) =>
  api.post<{ accessToken: string; user: User }>('/auth/login', {
    email,
    password,
  })

export const register = (data: { name: string; email: string; password: string }) =>
  api.post<User>('/auth/register', data)

// Students
export const listStudents = () => api.get<StudentProfile[]>('/students')
export const getStudent = (id: string) => api.get<StudentProfile>(`/students/${id}`)
export const createStudent = (data: Record<string, unknown>) =>
  api.post<StudentProfile>('/students', data)
export const updateStudent = (id: string, data: Record<string, unknown>) =>
  api.patch<StudentProfile>(`/students/${id}`, data)
export const deleteStudent = (id: string) => api.delete(`/students/${id}`)
export const getMyProfile = () => api.get<StudentProfile>('/students/me')
export const completeMyProfile = (data: Record<string, unknown>) =>
  api.post<StudentProfile>('/students/me', data)

// Medical records
export const getMedicalRecord = (studentProfileId: string) =>
  api.get<MedicalRecord>(`/medical-records/${studentProfileId}`)
export const upsertMedicalRecord = (
  studentProfileId: string,
  data: Record<string, unknown>,
) => api.put<MedicalRecord>(`/medical-records/${studentProfileId}`, data)

// Guardians
export const listGuardians = (studentProfileId: string) =>
  api.get<Guardian[]>('/guardians', { params: { studentProfileId } })
export const createGuardian = (data: Record<string, unknown>) =>
  api.post<Guardian>('/guardians', data)
export const updateGuardian = (id: string, data: Record<string, unknown>) =>
  api.patch<Guardian>(`/guardians/${id}`, data)
export const deleteGuardian = (id: string) => api.delete(`/guardians/${id}`)

// Belt history
export const listBeltHistory = (studentProfileId: string) =>
  api.get<BeltHistory[]>('/belt-history', { params: { studentProfileId } })
export const createBeltHistory = (data: Record<string, unknown>) =>
  api.post<BeltHistory>('/belt-history', data)
export const deleteBeltHistory = (id: string) => api.delete(`/belt-history/${id}`)

// Enrollments
export const listEnrollments = () => api.get<Enrollment[]>('/enrollments')
export const getEnrollment = (id: string) => api.get<Enrollment>(`/enrollments/${id}`)
export const createEnrollment = (data: Record<string, unknown>) =>
  api.post<Enrollment>('/enrollments', data)
export const updateEnrollment = (id: string, data: Record<string, unknown>) =>
  api.patch<Enrollment>(`/enrollments/${id}`, data)
export const approveEnrollment = (id: string) =>
  api.post<Enrollment>(`/enrollments/${id}/approve`)
export const deleteEnrollment = (id: string) => api.delete(`/enrollments/${id}`)
export const getMyEnrollments = () => api.get<Enrollment[]>('/enrollments/mine')

// Classes
export const listClasses = () => api.get<ClassEntity[]>('/classes')
export const createClass = (data: Record<string, unknown>) =>
  api.post<ClassEntity>('/classes', data)
export const updateClass = (id: string, data: Record<string, unknown>) =>
  api.patch<ClassEntity>(`/classes/${id}`, data)
export const deleteClass = (id: string) => api.delete(`/classes/${id}`)
export const listClassStudents = (id: string) =>
  api.get<StudentClass[]>(`/classes/${id}/students`)
export const addStudentToClass = (id: string, enrollmentId: string) =>
  api.post<StudentClass>(`/classes/${id}/students`, { enrollmentId })
export const removeStudentFromClass = (id: string, enrollmentId: string) =>
  api.delete(`/classes/${id}/students/${enrollmentId}`)

// Attendance
export const listAttendance = () => api.get<Attendance[]>('/attendance')
export const listAttendanceByClass = (classId: string) =>
  api.get<Attendance[]>(`/attendance/class/${classId}`)
export const createAttendance = (data: Record<string, unknown>) =>
  api.post<Attendance>('/attendance', data)
export const updateAttendance = (id: string, data: Record<string, unknown>) =>
  api.patch<Attendance>(`/attendance/${id}`, data)
export const deleteAttendance = (id: string) => api.delete(`/attendance/${id}`)

// Payments
export const listPayments = () => api.get<Payment[]>('/payments')
export const createPayment = (data: Record<string, unknown>) =>
  api.post<Payment>('/payments', data)
export const updatePayment = (id: string, data: Record<string, unknown>) =>
  api.patch<Payment>(`/payments/${id}`, data)
export const confirmPayment = (id: string) =>
  api.post<Payment>(`/payments/${id}/confirm`)
export const deletePayment = (id: string) => api.delete(`/payments/${id}`)
export const getMyPayments = () => api.get<Payment[]>('/payments/mine')
