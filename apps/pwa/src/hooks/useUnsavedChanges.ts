import { useEffect, useCallback, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'

interface UseUnsavedChangesOptions {
  /** Si hay cambios sin guardar */
  hasChanges: boolean
  /** Mensaje a mostrar en el diálogo de confirmación */
  message?: string
  /** Callback opcional cuando el usuario confirma salir */
  onConfirmLeave?: () => void
}

interface UseUnsavedChangesReturn {
  /** Si el bloqueador está actualmente bloqueando la navegación */
  isBlocking: boolean
  /** Confirmar la navegación (permitir salir) */
  confirmNavigation: () => void
  /** Cancelar la navegación (quedarse en la página) */
  cancelNavigation: () => void
  /** Resetear el estado de cambios */
  resetChanges: () => void
}

/**
 * Hook para detectar y prevenir la navegación cuando hay cambios sin guardar.
 * Muestra un diálogo de confirmación antes de salir de la página.
 * 
 * @example
 * ```tsx
 * const { isDirty } = useForm()
 * const { isBlocking, confirmNavigation, cancelNavigation } = useUnsavedChanges({
 *   hasChanges: isDirty,
 *   message: '¿Deseas salir sin guardar los cambios?'
 * })
 * 
 * // Renderizar diálogo de confirmación
 * {isBlocking && (
 *   <AlertDialog open>
 *     <AlertDialogContent>
 *       <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
 *       <AlertDialogDescription>
 *         Tienes cambios sin guardar. ¿Deseas salir de todos modos?
 *       </AlertDialogDescription>
 *       <AlertDialogFooter>
 *         <AlertDialogCancel onClick={cancelNavigation}>Cancelar</AlertDialogCancel>
 *         <AlertDialogAction onClick={confirmNavigation}>Salir</AlertDialogAction>
 *       </AlertDialogFooter>
 *     </AlertDialogContent>
 *   </AlertDialog>
 * )}
 * ```
 */
export function useUnsavedChanges({
  hasChanges,
  message = '¿Estás seguro de que deseas salir? Los cambios sin guardar se perderán.',
  onConfirmLeave,
}: UseUnsavedChangesOptions): UseUnsavedChangesReturn {
  const [manualReset, setManualReset] = useState(false)
  const hasChangesRef = useRef(hasChanges)
  hasChangesRef.current = hasChanges && !manualReset

  // Usar el bloqueador de React Router
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasChangesRef.current && currentLocation.pathname !== nextLocation.pathname
  )

  // Prevenir cierre de pestaña/navegador
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasChangesRef.current) {
        event.preventDefault()
        // Chrome requiere returnValue
        event.returnValue = message
        return message
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [message])

  const confirmNavigation = useCallback(() => {
    if (blocker.state === 'blocked') {
      onConfirmLeave?.()
      blocker.proceed()
    }
  }, [blocker, onConfirmLeave])

  const cancelNavigation = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }, [blocker])

  const resetChanges = useCallback(() => {
    setManualReset(true)
    // Reset después de un tick para permitir que el bloqueador se actualice
    setTimeout(() => setManualReset(false), 0)
  }, [])

  return {
    isBlocking: blocker.state === 'blocked',
    confirmNavigation,
    cancelNavigation,
    resetChanges,
  }
}

/**
 * Hook simplificado para formularios con react-hook-form
 * que detecta automáticamente cambios usando isDirty
 */
export function useFormUnsavedChanges(isDirty: boolean, onConfirmLeave?: () => void) {
  return useUnsavedChanges({
    hasChanges: isDirty,
    message: '¿Deseas salir sin guardar los cambios del formulario?',
    onConfirmLeave,
  })
}

export default useUnsavedChanges
