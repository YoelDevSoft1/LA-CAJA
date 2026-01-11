import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Wifi, WifiOff, RefreshCw, Check, AlertTriangle, Cloud, CloudOff } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { colors } from '@/design-system'

// ============================================================================
// Status Badge Variants
// ============================================================================

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-300',
  {
    variants: {
      variant: {
        online: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        offline: 'bg-red-50 text-red-700 border border-red-200',
        syncing: 'bg-amber-50 text-amber-700 border border-amber-200',
        synced: 'bg-sky-50 text-sky-700 border border-sky-200',
        error: 'bg-red-50 text-red-700 border border-red-200',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'online',
      size: 'md',
    },
  }
)

// ============================================================================
// Types
// ============================================================================

type SyncState = 'online' | 'offline' | 'syncing' | 'synced' | 'error'

interface SyncStatusProps extends VariantProps<typeof statusBadgeVariants> {
  state: SyncState
  className?: string
  showLabel?: boolean
  pendingCount?: number
}

interface ConnectionStatusProps {
  isOnline: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

// ============================================================================
// Status Icons
// ============================================================================

const StatusIcon = ({ state, className }: { state: SyncState; className?: string }) => {
  const iconClass = cn('flex-shrink-0', className)

  switch (state) {
    case 'online':
      return <Wifi className={iconClass} />
    case 'offline':
      return <WifiOff className={iconClass} />
    case 'syncing':
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className={iconClass} />
        </motion.div>
      )
    case 'synced':
      return <Check className={iconClass} />
    case 'error':
      return <AlertTriangle className={iconClass} />
    default:
      return <Cloud className={iconClass} />
  }
}

const statusLabels: Record<SyncState, string> = {
  online: 'En línea',
  offline: 'Sin conexión',
  syncing: 'Sincronizando...',
  synced: 'Sincronizado',
  error: 'Error de sync',
}

// ============================================================================
// SyncStatus Component
// ============================================================================

/**
 * SyncStatus - Badge que muestra el estado de sincronización
 *
 * Ideal para el header o sidebar del dashboard para mostrar
 * el estado de conexión y sincronización con el servidor.
 *
 * @example
 * <SyncStatus state="syncing" showLabel />
 *
 * @example
 * <SyncStatus state="offline" pendingCount={5} />
 */
export function SyncStatus({
  state,
  className,
  size = 'md',
  showLabel = true,
  pendingCount,
}: SyncStatusProps) {
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'

  return (
    <motion.div
      className={cn(statusBadgeVariants({ variant: state, size }), className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <StatusIcon state={state} className={iconSize} />

      <AnimatePresence mode="wait">
        {showLabel && (
          <motion.span
            key={state}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            transition={{ duration: 0.15 }}
          >
            {statusLabels[state]}
          </motion.span>
        )}
      </AnimatePresence>

      {pendingCount !== undefined && pendingCount > 0 && (
        <motion.span
          className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] rounded-full font-bold"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500 }}
        >
          {pendingCount}
        </motion.span>
      )}
    </motion.div>
  )
}

// ============================================================================
// ConnectionStatus Component
// ============================================================================

/**
 * ConnectionStatus - Indicador simple de conexión online/offline
 *
 * Versión simplificada de SyncStatus solo para mostrar
 * si hay conexión a internet.
 *
 * @example
 * const { isOnline } = useOnline()
 * <ConnectionStatus isOnline={isOnline} />
 */
export function ConnectionStatus({
  isOnline,
  className,
  size = 'md',
  showLabel = true,
}: ConnectionStatusProps) {
  const state: SyncState = isOnline ? 'online' : 'offline'

  return <SyncStatus state={state} className={className} size={size} showLabel={showLabel} />
}

// ============================================================================
// SyncIndicator (Minimal dot indicator)
// ============================================================================

interface SyncIndicatorProps {
  state: SyncState
  className?: string
  pulse?: boolean
}

/**
 * SyncIndicator - Indicador minimalista de punto
 *
 * Para usar en espacios reducidos como junto al logo.
 *
 * @example
 * <div className="flex items-center gap-2">
 *   <Logo />
 *   <SyncIndicator state="syncing" pulse />
 * </div>
 */
export function SyncIndicator({ state, className, pulse = true }: SyncIndicatorProps) {
  const stateColors: Record<SyncState, string> = {
    online: colors.status.online,
    offline: colors.status.offline,
    syncing: colors.status.syncing,
    synced: colors.status.online,
    error: colors.status.offline,
  }

  return (
    <motion.div
      className={cn('relative flex items-center justify-center', className)}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
    >
      {/* Pulse ring */}
      {pulse && (state === 'syncing' || state === 'online') && (
        <motion.div
          className="absolute w-3 h-3 rounded-full"
          style={{ backgroundColor: stateColors[state] }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: state === 'syncing' ? 1 : 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Main dot */}
      <motion.div
        className="w-2 h-2 rounded-full relative z-10"
        style={{ backgroundColor: stateColors[state] }}
        animate={state === 'syncing' ? { scale: [1, 0.8, 1] } : {}}
        transition={{
          duration: 0.5,
          repeat: state === 'syncing' ? Infinity : 0,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  )
}

// ============================================================================
// CloudSyncStatus (For header/topbar)
// ============================================================================

interface CloudSyncStatusProps {
  isOnline: boolean
  isSyncing?: boolean
  lastSyncTime?: Date | null
  pendingChanges?: number
  className?: string
}

/**
 * CloudSyncStatus - Estado de sincronización con icono de nube
 *
 * Diseñado para el topbar del dashboard, muestra el estado
 * de conexión con el servidor y cambios pendientes.
 *
 * @example
 * <CloudSyncStatus
 *   isOnline={true}
 *   isSyncing={false}
 *   lastSyncTime={new Date()}
 *   pendingChanges={0}
 * />
 */
export function CloudSyncStatus({
  isOnline,
  isSyncing = false,
  lastSyncTime,
  pendingChanges = 0,
  className,
}: CloudSyncStatusProps) {
  const getState = (): SyncState => {
    if (!isOnline) return 'offline'
    if (isSyncing) return 'syncing'
    if (pendingChanges > 0) return 'syncing'
    return 'synced'
  }

  const state = getState()

  const formatTime = (date: Date | null) => {
    if (!date) return 'Nunca'
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Ahora'
    if (minutes < 60) return `Hace ${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Hace ${hours}h`
    return date.toLocaleDateString()
  }

  return (
    <motion.div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Cloud Icon */}
      <div className="relative">
        {isOnline ? (
          <Cloud
            className="w-4 h-4 text-sky-500"
          />
        ) : (
          <CloudOff className="w-4 h-4 text-slate-400" />
        )}

        {/* Sync spinner overlay */}
        {isSyncing && (
          <motion.div
            className="absolute -right-0.5 -bottom-0.5 w-2 h-2 rounded-full bg-amber-500"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
      </div>

      {/* Status text */}
      <div className="flex flex-col">
        <span className="text-xs font-medium text-slate-700">
          {state === 'offline' && 'Sin conexión'}
          {state === 'syncing' && 'Sincronizando...'}
          {state === 'synced' && 'Sincronizado'}
        </span>

        {lastSyncTime && state !== 'offline' && (
          <span className="text-[10px] text-slate-400">
            {formatTime(lastSyncTime)}
          </span>
        )}
      </div>

      {/* Pending badge */}
      {pendingChanges > 0 && (
        <motion.span
          className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded font-semibold"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          {pendingChanges} pendiente{pendingChanges > 1 ? 's' : ''}
        </motion.span>
      )}
    </motion.div>
  )
}

export default SyncStatus
