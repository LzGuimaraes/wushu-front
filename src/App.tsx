import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAdmin, RequireAuth } from './components/RequireAuth'
import { useAuth } from './context/AuthContext'
import Attendance from './pages/Attendance'
import Classes from './pages/Classes'
import Dashboard from './pages/Dashboard'
import Enrollments from './pages/Enrollments'
import Login from './pages/Login'
import MyPortal from './pages/MyPortal'
import Payments from './pages/Payments'
import Register from './pages/Register'
import StudentDetail from './pages/StudentDetail'
import Students from './pages/Students'

function Home() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Dashboard /> : <Navigate to="/portal" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route
          path="students"
          element={
            <RequireAdmin>
              <Students />
            </RequireAdmin>
          }
        />
        <Route
          path="students/:id"
          element={
            <RequireAdmin>
              <StudentDetail />
            </RequireAdmin>
          }
        />
        <Route
          path="enrollments"
          element={
            <RequireAdmin>
              <Enrollments />
            </RequireAdmin>
          }
        />
        <Route
          path="classes"
          element={
            <RequireAdmin>
              <Classes />
            </RequireAdmin>
          }
        />
        <Route
          path="attendance"
          element={
            <RequireAdmin>
              <Attendance />
            </RequireAdmin>
          }
        />
        <Route
          path="payments"
          element={
            <RequireAdmin>
              <Payments />
            </RequireAdmin>
          }
        />
        <Route path="portal" element={<MyPortal />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

