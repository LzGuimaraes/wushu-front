import api from "./client";
import type {
  AdminDashboard,
  AdminReportRow,
  Attendance,
  BeltHistory,
  ClassEntity,
  Enrollment,
  EnrollmentWithClasses,
  Guardian,
  LandingData,
  MedicalRecord,
  Notification,
  Payment,
  PendingRegistration,
  PublicInstructor,
  StudentClass,
  StudentProfile,
  User,
} from "../types";

// Auth
export const login = (email: string, password: string) =>
  api.post<{ accessToken: string; user: User }>("/auth/login", {
    email,
    password,
  });

export const register = (data: {
  name: string;
  email: string;
  password: string;
}) =>
  api.post<{ accessToken: string; user: User; message: string }>(
    "/auth/register",
    data,
  );

export const resendConfirmation = (email: string) =>
  api.post<{ message: string }>("/auth/resend-confirmation", { email });

// Public (landing)
export const getLanding = () => api.get<LandingData>("/public/landing");
export const listPublicInstructors = () =>
  api.get<PublicInstructor[]>("/public/instructors");

// Users (self)
export const updateMe = (data: Record<string, unknown>) =>
  api.patch<User>("/users/me", data);

// Users (admin)
export const listPendingRegistrations = () =>
  api.get<PendingRegistration[]>("/users/pending");
export const approveUser = (id: string) =>
  api.patch<User>(`/users/${id}/approve`);
export const rejectUser = (id: string, reason: string) =>
  api.patch<User>(`/users/${id}/reject`, { reason });
export const approveUsersBatch = (ids: string[]) =>
  api.patch<{ approved: number }>("/users/approve-batch", { ids });

// Users
export const listUsers = () => api.get<User[]>("/users");

// Students
export const listStudents = () => api.get<StudentProfile[]>("/students");
export const getStudent = (id: string) =>
  api.get<StudentProfile>(`/students/${id}`);
export const createStudent = (data: Record<string, unknown>) =>
  api.post<StudentProfile>("/students", data);
export const updateStudent = (id: string, data: Record<string, unknown>) =>
  api.patch<StudentProfile>(`/students/${id}`, data);
export const deleteStudent = (id: string) => api.delete(`/students/${id}`);
export const getMyProfile = () => api.get<StudentProfile>("/students/me");
export const completeMyProfile = (data: Record<string, unknown>) =>
  api.post<StudentProfile>("/students/me", data);
export const updateMyProfile = (data: Record<string, unknown>) =>
  api.patch<StudentProfile>("/students/me", data);

// Medical records
export const getMyMedicalRecord = () => api.get<MedicalRecord>("/medical-records/me");
export const upsertMyMedicalRecord = (data: Record<string, unknown>) =>
  api.put<MedicalRecord>("/medical-records/me", data);
export const getMedicalRecord = (studentProfileId: string) =>
  api.get<MedicalRecord>(`/medical-records/${studentProfileId}`);
export const upsertMedicalRecord = (
  studentProfileId: string,
  data: Record<string, unknown>,
) => api.put<MedicalRecord>(`/medical-records/${studentProfileId}`, data);

// Guardians
export const getMyGuardians = () => api.get<Guardian[]>("/guardians/me");
export const createMyGuardian = (data: Record<string, unknown>) =>
  api.post<Guardian>("/guardians/me", data);
export const updateMyGuardian = (id: string, data: Record<string, unknown>) =>
  api.patch<Guardian>(`/guardians/me/${id}`, data);
export const deleteMyGuardian = (id: string) => api.delete(`/guardians/me/${id}`);
export const listGuardians = (studentProfileId: string) =>
  api.get<Guardian[]>("/guardians", { params: { studentProfileId } });
export const createGuardian = (data: Record<string, unknown>) =>
  api.post<Guardian>("/guardians", data);
export const updateGuardian = (id: string, data: Record<string, unknown>) =>
  api.patch<Guardian>(`/guardians/${id}`, data);
export const deleteGuardian = (id: string) => api.delete(`/guardians/${id}`);

// Belt history
export const listBeltHistory = (studentProfileId: string) =>
  api.get<BeltHistory[]>("/belt-history", { params: { studentProfileId } });
export const createBeltHistory = (data: Record<string, unknown>) =>
  api.post<BeltHistory>("/belt-history", data);
export const deleteBeltHistory = (id: string) =>
  api.delete(`/belt-history/${id}`);

// Enrollments
export const listEnrollments = () => api.get<Enrollment[]>("/enrollments");
export const getEnrollment = (id: string) =>
  api.get<Enrollment>(`/enrollments/${id}`);
export const createEnrollment = (data: Record<string, unknown>) =>
  api.post<Enrollment>("/enrollments", data);
export const updateEnrollment = (id: string, data: Record<string, unknown>) =>
  api.patch<Enrollment>(`/enrollments/${id}`, data);
export const approveEnrollment = (id: string) =>
  api.post<Enrollment>(`/enrollments/${id}/approve`);
export const deleteEnrollment = (id: string) =>
  api.delete(`/enrollments/${id}`);
export const getMyEnrollments = () =>
  api.get<EnrollmentWithClasses[]>("/enrollments/mine");

// Classes
export const listClasses = () => api.get<ClassEntity[]>("/classes");
export const createClass = (data: Record<string, unknown>) =>
  api.post<ClassEntity>("/classes", data);
export const updateClass = (id: string, data: Record<string, unknown>) =>
  api.patch<ClassEntity>(`/classes/${id}`, data);
export const deleteClass = (id: string) => api.delete(`/classes/${id}`);
export const listClassStudents = (id: string) =>
  api.get<StudentClass[]>(`/classes/${id}/students`);
export const addStudentToClass = (id: string, enrollmentId: string) =>
  api.post<StudentClass>(`/classes/${id}/students`, { enrollmentId });
export const removeStudentFromClass = (id: string, enrollmentId: string) =>
  api.delete(`/classes/${id}/students/${enrollmentId}`);

// Attendance
export const listAttendance = () => api.get<Attendance[]>("/attendance");
export const listAttendanceByClass = (classId: string) =>
  api.get<Attendance[]>(`/attendance/class/${classId}`);
export const createAttendance = (data: Record<string, unknown>) =>
  api.post<Attendance>("/attendance", data);
export const updateAttendance = (id: string, data: Record<string, unknown>) =>
  api.patch<Attendance>(`/attendance/${id}`, data);
export const deleteAttendance = (id: string) => api.delete(`/attendance/${id}`);

// Payments
export const listPayments = () => api.get<Payment[]>("/payments");
export const createPayment = (data: Record<string, unknown>) =>
  api.post<Payment>("/payments", data);
export const updatePayment = (id: string, data: Record<string, unknown>) =>
  api.patch<Payment>(`/payments/${id}`, data);
export const confirmPayment = (id: string) =>
  api.post<Payment>(`/payments/${id}/confirm`);
export const deletePayment = (id: string) => api.delete(`/payments/${id}`);
export const getMyPayments = () => api.get<Payment[]>("/payments/mine");

// Admin
export const getAdminDashboard = (month: string) =>
  api.get<AdminDashboard>("/admin/dashboard", { params: { month } });
export const getAdminStudentsReport = (month: string) =>
  api.get<AdminReportRow[]>("/admin/students-report", { params: { month } });
export const getAdminStudentsReportPdf = (month: string) =>
  api.get("/admin/students-report/pdf", {
    params: { month },
    responseType: "blob",
  });

// Notifications
export const getMyNotifications = () =>
  api.get<Notification[]>("/notifications/mine");
