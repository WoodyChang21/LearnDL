import { createContext } from "react"
import type { AuthUser } from "./authService"

export interface AuthContextType {
  isAuthenticated: boolean
  isAuthLoading: boolean
  user: AuthUser | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)
