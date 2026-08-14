export type UserRole = 'ADMIN' | 'STUDENT'
export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
export type StudentGoal =
  | 'FITNESS'
  | 'COMPETITION'
  | 'SELF_DEFENSE'
  | 'LEISURE'
  | 'OTHER'
export type EnrollmentStatus = 'PENDING' | 'ACTIVE' | 'CANCELLED' | 'FINISHED'
export type PaymentMethod = 'PIX' | 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD'
export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface StudentProfile {
  id: string
  userId: string
  cpf: string
  birthDate: string | null
  phone: string
  responsiblePhone: string | null
  address: string
  district: string
  city: string
  zipCode: string
  emergencyContact: string | null
  belt: string | null
  trainingModality: string
  hasPreviousMartialArt: boolean
  previousMartialArt: string | null
  goal: StudentGoal
  goalDescription: string | null
  createdAt: string
  updatedAt: string
}

export interface MedicalRecord {
  id: string
  studentProfileId: string
  hasDisease: boolean
  diseaseDescription: string | null
  usesMedication: boolean
  medicationDescription: string | null
  hasPhysicalLimitation: boolean
  physicalLimitationDescription: string | null
  hasAllergy: boolean
  allergyDescription: string | null
  hasPreviousInjury: boolean
  previousInjuryDescription: string | null
  createdAt: string
  updatedAt: string
}

export interface Guardian {
  id: string
  studentProfileId: string
  name: string
  cpf: string
  phone: string
  signatureUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface BeltHistory {
  id: string
  studentProfileId: string
  belt: string
  graduationDate: string | null
  notes: string | null
  createdAt: string
}

export interface Enrollment {
  id: string
  studentId: string
  enrollmentNumber: string
  status: EnrollmentStatus
  registrationDate: string
  startDate: string | null
  endDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ClassEntity {
  id: string
  instructorId: string
  name: string
  description: string | null
  schedule: string | null
  createdAt: string
  updatedAt: string
}

export interface StudentClass {
  id: string
  enrollmentId: string
  classId: string
  createdAt: string
  updatedAt: string
}

export interface Attendance {
  id: string
  enrollmentId: string
  classId: string
  attendanceDate: string
  present: boolean
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  enrollmentId: string
  amount: string
  competence: string
  dueDate: string
  paymentDate: string | null
  paymentMethod: PaymentMethod
  status: PaymentStatus
  notes: string | null
  createdAt: string
  updatedAt: string
}
