import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Layout() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>🥋 Kung Fu Manager</h1>
        <nav>
          {isAdmin ? (
            <>
              <NavLink to="/" end>
                Dashboard
              </NavLink>
              <NavLink to="/students">Alunos</NavLink>
              <NavLink to="/enrollments">Matrículas</NavLink>
              <NavLink to="/classes">Turmas</NavLink>
              <NavLink to="/attendance">Frequência</NavLink>
              <NavLink to="/payments">Pagamentos</NavLink>
            </>
          ) : (
            <NavLink to="/portal">Meu Portal</NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <span>{user?.name}</span>
          <button onClick={handleLogout}>Sair</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
