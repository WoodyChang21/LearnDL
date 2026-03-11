import { useEffect, useState } from "react"
import { AuthContext } from "./authContext"
import { getCurrentUser, logoutUser, type AuthUser } from "./authService"

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(
    () => typeof window !== "undefined" && Boolean(window.localStorage.getItem("accessToken"))
  )
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("accessToken")

    if (!token) {
      setIsAuthLoading(false)
      return
    }

    let isMounted = true

    const syncAuthState = async () => {
      try {
        const currentUser = await getCurrentUser()

        if (!isMounted) {
          return
        }

        setUser(currentUser)
        setIsAuthenticated(true)
      } catch {
        logoutUser()

        if (!isMounted) {
          return
        }

        setUser(null)
        setIsAuthenticated(false)
      } finally {
        if (isMounted) {
          setIsAuthLoading(false)
        }
      }
    }

    void syncAuthState()

    return () => {
      isMounted = false
    }
  }, [])

  const login = (token: string, nextUser: AuthUser) => {
    localStorage.setItem("accessToken", token)
    setUser(nextUser)
    setIsAuthLoading(false)
    setIsAuthenticated(true)
  }

  const logout = () => {
    logoutUser()
    setUser(null)
    setIsAuthLoading(false)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isAuthLoading, user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
