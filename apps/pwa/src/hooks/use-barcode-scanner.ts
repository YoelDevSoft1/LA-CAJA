import { useEffect, useCallback, useRef } from 'react'

interface BarcodeScannerOptions {
  /**
   * Callback cuando se detecta un código de barras completo
   */
  onScan: (barcode: string) => void
  /**
   * Tiempo máximo entre caracteres para considerar entrada de scanner (ms)
   * Los escáneres típicos envían caracteres cada 10-50ms; algunos van hasta 80-100ms
   * Default: 80ms
   */
  maxIntervalMs?: number
  /**
   * Longitud mínima del código de barras para ser válido
   * Default: 4
   */
  minLength?: number
  /**
   * Longitud máxima del código de barras
   * Default: 50
   */
  maxLength?: number
  /**
   * Tecla que termina el escaneo (los scanners envían Enter al final)
   * Default: 'Enter'
   */
  endKey?: string
  /**
   * Si está habilitado o no
   * Default: true
   */
  enabled?: boolean
  /**
   * Prevenir que el evento se propague cuando es un escaneo
   * Default: true
   */
  preventDefault?: boolean
}

/**
 * Hook profesional para detectar entrada de lectores de código de barras.
 *
 * Los escáneres de código de barras funcionan como teclados virtuales que:
 * 1. Envían caracteres muy rápidamente (10-50ms entre cada uno)
 * 2. Terminan con Enter
 *
 * Este hook distingue entre escritura humana (lenta) y escaneo (rápido)
 * para evitar falsos positivos cuando el usuario escribe manualmente.
 *
 * @example
 * ```tsx
 * useBarcodeScanner({
 *   onScan: (barcode) => {
 *     console.log('Código escaneado:', barcode)
 *     // Buscar producto por código de barras
 *   },
 *   enabled: true,
 * })
 * ```
 */
export function useBarcodeScanner({
  onScan,
  maxIntervalMs = 80,
  minLength = 4,
  maxLength = 50,
  endKey = 'Enter',
  enabled = true,
  preventDefault = true,
}: BarcodeScannerOptions) {
  // Buffer para acumular caracteres del escaneo
  const bufferRef = useRef<string>('')
  // Timestamp del último caracter recibido
  const lastKeyTimeRef = useRef<number>(0)
  // Flag para saber si estamos en medio de un escaneo potencial
  const isScanningRef = useRef<boolean>(false)
  // Timeout para limpiar el buffer si no se completa el escaneo
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Limpiar el buffer
  const clearBuffer = useCallback(() => {
    bufferRef.current = ''
    isScanningRef.current = false
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Procesar el código escaneado
  const processBarcode = useCallback((barcode: string) => {
    // Limpiar espacios y caracteres no válidos
    const cleanBarcode = barcode.trim()

    // Validar longitud
    if (cleanBarcode.length >= minLength && cleanBarcode.length <= maxLength) {
      onScan(cleanBarcode)
    }

    clearBuffer()
  }, [onScan, minLength, maxLength, clearBuffer])

  useEffect(() => {
    if (!enabled) {
      clearBuffer()
      return
    }

    /** Si no fue un escaneo válido y habíamos interceptado en un input, devolver el texto. */
    const releaseToInput = (text: string) => {
      if (!text) return
      const el = document.activeElement
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        const start = el.selectionStart ?? el.value.length
        const end = el.selectionEnd ?? el.value.length
        const next = el.value.slice(0, start) + text + el.value.slice(end)
        el.value = next
        el.setSelectionRange(start + text.length, start + text.length)
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }

    const scheduleClear = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        const buf = bufferRef.current
        clearBuffer()
        if (buf) releaseToInput(buf)
      }, 500)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const now = Date.now()
      const timeSinceLastKey = now - lastKeyTimeRef.current
      const key = event.key

      const activeElement = document.activeElement
      const isInputElement =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement

      // Enter: escaneo completo o devolver buffer al input
      if (key === endKey) {
        if (bufferRef.current.length >= minLength && isScanningRef.current) {
          if (preventDefault) {
            event.preventDefault()
            event.stopPropagation()
          }
          processBarcode(bufferRef.current)
          return
        }
        releaseToInput(bufferRef.current)
        clearBuffer()
        return
      }

      if (key.length !== 1) return
      if (!/^[a-zA-Z0-9\-_\.\/\+\=]$/.test(key)) {
        clearBuffer()
        return
      }

      // En inputs con data-barcode-passthrough (p. ej. buscador POS) no interceptar:
      // la escritura va directa al input y la búsqueda se actualiza al instante.
      // Para escanear, usar el lector con el foco fuera del buscador.
      if (isInputElement && (activeElement as HTMLElement).getAttribute?.('data-barcode-passthrough') === 'true') {
        return
      }

      const isRapidInput = timeSinceLastKey < maxIntervalMs

      if (bufferRef.current.length === 0) {
        bufferRef.current = key
        lastKeyTimeRef.current = now
        isScanningRef.current = false
        // Interceptar también el primer carácter si está en input (siempre priorizar scanner)
        if (isInputElement && preventDefault) {
          event.preventDefault()
          event.stopPropagation()
        }
        scheduleClear()
        return
      }

      if (isRapidInput) {
        bufferRef.current += key
        lastKeyTimeRef.current = now
        isScanningRef.current = true
        if (isInputElement && preventDefault) {
          event.preventDefault()
          event.stopPropagation()
        }
        scheduleClear()
        if (bufferRef.current.length > maxLength) clearBuffer()
      } else {
        // Entrada lenta: no es escaneo. Devolver lo que habíamos interceptado al input antes de resetear.
        releaseToInput(bufferRef.current)
        clearBuffer()
        bufferRef.current = key
        lastKeyTimeRef.current = now
        if (isInputElement && preventDefault) {
          event.preventDefault()
          event.stopPropagation()
        }
        scheduleClear()
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
      clearBuffer()
    }
  }, [enabled, maxIntervalMs, minLength, maxLength, endKey, preventDefault, processBarcode, clearBuffer])

  // Retornar función para limpiar manualmente si es necesario
  return { clearBuffer }
}

export default useBarcodeScanner
