import { Navigate } from 'react-router-dom'
import { useAuth } from '@/stores/auth.store'
import { getDefaultRoute, type Role } from '@/lib/permissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowLicenseBlocked?: boolean
  allowedRoles?: Role[]
}

function isLicenseBlocked(user: ReturnType<typeof useAuth.getState>['user']) {
  if (!user) return false

  const isSuspended = user.license_status === 'suspended'
  const expiresAt = user.license_expires_at ? new Date(user.license_expires_at).getTime() : null
  const isExpired = !!expiresAt && expiresAt < Date.now()

  return isSuspended || isExpired
}

export default function ProtectedRoute({
  children,
  allowLicenseBlocked = false,
  allowedRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const userRole = user?.role || 'cashier'
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to={getDefaultRoute(userRole)} replace />
    }
  }

  const blocked = isLicenseBlocked(user)
  if (blocked && !allowLicenseBlocked) {
    return <Navigate to="/license" replace />
  }

  return <>{children}</>
}
