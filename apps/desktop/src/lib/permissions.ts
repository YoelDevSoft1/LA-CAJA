export type Role = 'owner' | 'cashier'

const CASHIER_ALLOWED_ROUTES = ['/pos', '/sales', '/cash', '/customers', '/debts']

export const isRouteAllowed = (path: string, role: Role) => {
  if (role === 'owner') return true
  return CASHIER_ALLOWED_ROUTES.some(
    (allowed) => path === allowed || path.startsWith(`${allowed}/`)
  )
}

export const getDefaultRoute = () => '/pos'
