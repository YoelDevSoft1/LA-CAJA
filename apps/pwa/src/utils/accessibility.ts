/**
 * Utilidades de accesibilidad para mejorar el soporte de screen readers
 * y cumplir con estándares WCAG
 */

/**
 * Crea props de accesibilidad para iconos en botones
 * 
 * Uso:
 * ```tsx
 * <Button {...iconButtonProps('Eliminar producto')}>
 *   <Trash2 />
 * </Button>
 * ```
 */
export function iconButtonProps(
  label: string,
  options?: {
    title?: string // Tooltip opcional (si es diferente del label)
  }
): {
  'aria-label': string
  title?: string
} {
  return {
    'aria-label': label,
    ...(options?.title && { title: options.title }),
    ...(!options?.title && { title: label }), // Usar label como title si no se especifica
  }
}

/**
 * Crea props de accesibilidad para enlaces que solo tienen iconos
 */
export function iconLinkProps(
  label: string,
  options?: {
    title?: string
  }
): {
  'aria-label': string
  title?: string
} {
  return iconButtonProps(label, options)
}

/**
 * Helper para anunciar cambios a screen readers
 * Útil para actualizaciones dinámicas que los usuarios deben conocer
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remover después de que el screen reader lo haya leído
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Props para ocultar elementos visualmente pero mantenerlos accesibles para screen readers
 */
export const srOnly = {
  position: 'absolute' as const,
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  borderWidth: 0,
}
