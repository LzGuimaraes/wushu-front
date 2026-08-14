import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { login as apiLogin, register as apiRegister } from '../api'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAdmin: boolean
  isApproved: boolean
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string) => Promise<string>
  logout: () => void
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readUser(): User | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readUser)
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token'),
  )

  const persist = (accessToken: string, nextUser: User) => {
    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(nextUser))
    setToken(accessToken)
    setUser(nextUser)
  }

  const login = async (email: string, password: string) => {
    const { data } = await apiLogin(email, password)
    persist(data.accessToken, data.user)
    return data.user
  }

  const register = async (name: string, email: string, password: string) => {
    const { data } = await apiRegister({ name, email, password })
    // Auto-login: o aluno recém-cadastrado já entra autenticado
    // e cai direto na tela de "aguardando aprovação".
    persist(data.accessToken, data.user)
    return data.message
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const isAdmin = user?.role === 'ADMIN'
  const isApproved = user?.status === 'ACTIVE'

  return (
    <AuthContext.Provider
      value={{ user, token, isAdmin, isApproved, login, register, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return ctx
}
