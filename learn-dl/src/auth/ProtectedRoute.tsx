import { Navigate } from "react-router"
import { useAuth } from "./useAuth"

interface Props {
  children: React.ReactElement
}

const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated, isAuthLoading } = useAuth()

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Checking session...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
