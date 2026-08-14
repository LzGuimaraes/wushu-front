import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import {
  RequireAdmin,
  RequireApproved,
  RequireAuth,
  RequireGuest,
} from './components/RequireAuth'
import { useAuth } from './context/AuthContext'
import Attendance from './pages/Attendance'
import Classes from './pages/Classes'
import AdminDashboard from './pages/AdminDashboard'
import ApprovalQueue from './pages/ApprovalQueue'
import Enrollments from './pages/Enrollments'
import InstructorsPage from './pages/InstructorsPage'
import Landing from './pages/Landing'
import Login from './pages/Login'
import MyClasses from './pages/MyClasses'
import MyPayments from './pages/MyPayments'
import MyPortal from './pages/MyPortal'
import MyProfile from './pages/MyProfile'
import Payments from './pages/Payments'
import Register from './pages/Register'
import StudentDetail from './pages/StudentDetail'
import Students from './pages/Students'
import WaitingScreen from './pages/WaitingScreen'

/**
 * Página raiz: público vê a landing; logado vai para o painel dele.
 * Conta não aprovada → tela de espera.
 */
function Home() {
  const { token, user, isAdmin } = useAuth()
  if (!token || !user) return <Landing />
  if (user.status !== 'ACTIVE') return <Navigate to="/aguardando-aprovacao" replace />
  return isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/portal" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Público */}
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={
          <RequireGuest>
            <Login />
          </RequireGuest>
        }
      />
      <Route
        path="/cadastro"
        element={
          <RequireGuest>
            <Register />
          </RequireGuest>
        }
      />
      <Route path="/register" element={<Navigate to="/cadastro" replace />} />
      <Route path="/aguardando-aprovacao" element={<WaitingScreen />} />

      {/* Área logada (conta aprovada) */}
      <Route
        element={
          <RequireAuth>
            <RequireApproved>
              <Layout />
            </RequireApproved>
          </RequireAuth>
        }
      >
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/aprovacoes"
          element={
            <RequireAdmin>
              <ApprovalQueue />
            </RequireAdmin>
          }
        />
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

        {/* Área do aluno */}
        <Route path="portal" element={<MyPortal />} />
        <Route path="portal/turmas" element={<MyClasses />} />
        <Route path="portal/pagamentos" element={<MyPayments />} />
        <Route path="portal/perfil" element={<MyProfile />} />
        <Route path="portal/instrutores" element={<InstructorsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

