import { Navigate } from 'react-router-dom'
import { useAuth } from '@/stores/auth.store'
import { getDefaultRoute, type Role } from '@/lib/permissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Role[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const userRole = user?.role || 'cashier'
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to={getDefaultRoute()} replace />
    }
  }

  return <>{children}</>
}
