export type Role = 'owner' | 'cashier'

const CASHIER_ALLOWED_ROUTES = [
  '/app/pos',
  '/app/fast-checkout',
  '/app/sales',
  '/app/cash',
  '/app/shifts',
  '/app/customers',
  '/app/debts',
  '/app/tables',
  '/app/fiscal-invoices',
]

export const isRouteAllowed = (path: string, role: Role) => {
  if (role === 'owner') return true
  return CASHIER_ALLOWED_ROUTES.some(
    (allowed) => path === allowed || path.startsWith(`${allowed}/`)
  )
}

export const getDefaultRoute = (role: Role) =>
  role === 'owner' ? '/app/dashboard' : '/app/pos'
