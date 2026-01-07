import { useState, useCallback, useEffect } from 'react'

export interface UseModalReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  setIsOpen: (value: boolean) => void
}

export interface UseModalOptions {
  defaultOpen?: boolean
  onOpen?: () => void
  onClose?: () => void
  closeOnEscape?: boolean
}

/**
 * Hook para gestionar el estado de modales de forma declarativa
 *
 * @example
 * ```tsx
 * const modal = useModal({
 *   onClose: () => console.log('Modal cerrado'),
 *   closeOnEscape: true
 * })
 *
 * return (
 *   <>
 *     <Button onClick={modal.open}>Abrir</Button>
 *     <MyModal isOpen={modal.isOpen} onClose={modal.close} />
 *   </>
 * )
 * ```
 */
export function useModal(options: UseModalOptions = {}): UseModalReturn {
  const {
    defaultOpen = false,
    onOpen,
    onClose,
    closeOnEscape = true,
  } = options

  const [isOpen, setIsOpen] = useState(defaultOpen)

  const open = useCallback(() => {
    setIsOpen(true)
    onOpen?.()
  }, [onOpen])

  const close = useCallback(() => {
    setIsOpen(false)
    onClose?.()
  }, [onClose])

  const toggle = useCallback(() => {
    if (isOpen) {
      close()
    } else {
      open()
    }
  }, [isOpen, open, close])

  // Manejar tecla ESC
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, close, closeOnEscape])

  // Prevenir scroll del body cuando modal está abierto
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  }
}
