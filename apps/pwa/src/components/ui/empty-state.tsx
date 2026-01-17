import { LucideIcon, Package, Search, FileX, Users, ShoppingCart, Inbox, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Componente reutilizable para empty states
 * Proporciona una UX consistente cuando no hay datos que mostrar
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-6',
      icon: 'w-10 h-10',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      icon: 'w-14 h-14',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16',
      icon: 'w-20 h-20',
      title: 'text-xl',
      description: 'text-base',
    },
  }

  const classes = sizeClasses[size]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        classes.container,
        className
      )}
    >
      <div className="rounded-full bg-muted/50 p-4 mb-4">
        <Icon className={cn('text-muted-foreground', classes.icon)} />
      </div>
      <h3 className={cn('font-semibold text-foreground', classes.title)}>
        {title}
      </h3>
      {description && (
        <p className={cn('text-muted-foreground mt-1 max-w-md', classes.description)}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
          {action && (
            <Button variant={action.variant || 'default'} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Variantes pre-configuradas para casos comunes
export function NoResultsState({
  searchTerm,
  onClear,
  className,
}: {
  searchTerm?: string
  onClear?: () => void
  className?: string
}) {
  return (
    <EmptyState
      icon={Search}
      title="No se encontraron resultados"
      description={
        searchTerm
          ? `No hay resultados para "${searchTerm}". Intenta con otros términos.`
          : 'No hay resultados que coincidan con tu búsqueda.'
      }
      action={onClear ? { label: 'Limpiar búsqueda', onClick: onClear, variant: 'outline' } : undefined}
      className={className}
      size="sm"
    />
  )
}

export function NoProductsState({
  onAdd,
  className,
}: {
  onAdd?: () => void
  className?: string
}) {
  return (
    <EmptyState
      icon={Package}
      title="No hay productos"
      description="Aún no has agregado ningún producto. Comienza creando tu primer producto."
      action={onAdd ? { label: 'Agregar Producto', onClick: onAdd } : undefined}
      className={className}
    />
  )
}

export function NoSalesState({
  className,
}: {
  className?: string
}) {
  return (
    <EmptyState
      icon={ShoppingCart}
      title="No hay ventas"
      description="Aún no se han registrado ventas en este período."
      className={className}
    />
  )
}

export function NoCustomersState({
  onAdd,
  className,
}: {
  onAdd?: () => void
  className?: string
}) {
  return (
    <EmptyState
      icon={Users}
      title="No hay clientes"
      description="Aún no has registrado ningún cliente. Los clientes te permiten llevar control de deudas y ventas."
      action={onAdd ? { label: 'Agregar Cliente', onClick: onAdd } : undefined}
      className={className}
    />
  )
}

export function NoDataState({
  title = 'No hay datos',
  description = 'No hay información disponible para mostrar.',
  className,
}: {
  title?: string
  description?: string
  className?: string
}) {
  return (
    <EmptyState
      icon={FileX}
      title={title}
      description={description}
      className={className}
      size="sm"
    />
  )
}

export function EmptyFolderState({
  title = 'Carpeta vacía',
  description,
  className,
}: {
  title?: string
  description?: string
  className?: string
}) {
  return (
    <EmptyState
      icon={FolderOpen}
      title={title}
      description={description}
      className={className}
      size="sm"
    />
  )
}
