import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { AuthContext } from "./authContext"
import {
  getCurrentUser,
  isSignupInProgress,
  logoutUser,
  type AuthUser,
} from "./authService"
import { auth } from "./firebase"

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    let isMounted = true

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        if (!isMounted) {
          return
        }

        setUser(null)
        setIsAuthenticated(false)
        setIsAuthLoading(false)
        return
      }

      try {
        if (isSignupInProgress()) {
          if (!isMounted) {
            return
          }

          setUser(null)
          setIsAuthenticated(false)
          return
        }

        const currentUser = await getCurrentUser()

        if (!isMounted) {
          return
        }

        if (!currentUser) {
          setUser(null)
          setIsAuthenticated(false)
          return
        }

        setUser(currentUser)
        setIsAuthenticated(true)
      } catch {
        await logoutUser()

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
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const login = (nextUser: AuthUser) => {
    setUser(nextUser)
    setIsAuthLoading(false)
    setIsAuthenticated(true)
  }

  const logout = async () => {
    await logoutUser()
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
