import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

/** Exige autenticação; deslogado vai para o login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** Exige conta aprovada (status ACTIVE). Bloqueio em guard, não só na UI. */
export function RequireApproved({ children }: { children: ReactNode }) {
  const { token, isApproved } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (!isApproved) return <Navigate to="/aguardando-aprovacao" replace />
  return <>{children}</>
}

/** Exige perfil ADMIN. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

/**
 * Para páginas que só fazem sentido deslogado (login/cadastro):
 * usuário já logado é levado ao painel dele.
 */
export function RequireGuest({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  if (token) return <Navigate to="/" replace />
  return <>{children}</>
}
