import { useEffect, useCallback, useRef } from 'react'

interface BarcodeScannerOptions {
  /**
   * Callback cuando se detecta un código de barras completo
   */
  onScan: (barcode: string) => void
  /**
   * Tiempo máximo entre caracteres para considerar entrada de scanner (ms)
   * Los escáneres típicos envían caracteres cada 10-50ms
   * Default: 50ms
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
  maxIntervalMs = 50,
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

    const handleKeyDown = (event: KeyboardEvent) => {
      const now = Date.now()
      const timeSinceLastKey = now - lastKeyTimeRef.current
      const key = event.key

      // Si el usuario está escribiendo en un input, textarea o select,
      // NO procesamos (a menos que sea muy rápido, típico de scanner)
      const activeElement = document.activeElement
      const isInputElement =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement

      // Si es la tecla de fin (Enter) y tenemos un buffer válido
      if (key === endKey) {
        if (bufferRef.current.length >= minLength && isScanningRef.current) {
          // Es un escaneo completo
          if (preventDefault) {
            event.preventDefault()
            event.stopPropagation()
          }
          processBarcode(bufferRef.current)
          return
        } else {
          // No es un escaneo válido, limpiar
          clearBuffer()
          return
        }
      }

      // Solo aceptar caracteres alfanuméricos y algunos símbolos comunes en códigos de barras
      if (key.length !== 1) {
        // Teclas especiales (Shift, Ctrl, etc.) - ignorar pero no limpiar
        return
      }

      // Verificar si es un caracter válido para código de barras
      if (!/^[a-zA-Z0-9\-_\.\/\+\=]$/.test(key)) {
        // Caracter no válido para código de barras, limpiar
        clearBuffer()
        return
      }

      // Determinar si es entrada de scanner (muy rápida) o humana (lenta)
      const isRapidInput = timeSinceLastKey < maxIntervalMs

      if (bufferRef.current.length === 0) {
        // Primer caracter - iniciar buffer
        bufferRef.current = key
        lastKeyTimeRef.current = now
        isScanningRef.current = false // Aún no sabemos si es scanner

        // Configurar timeout para limpiar si no se completa
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          clearBuffer()
        }, 500) // 500ms timeout para completar escaneo

        return
      }

      if (isRapidInput) {
        // Entrada rápida - probablemente scanner
        bufferRef.current += key
        lastKeyTimeRef.current = now
        isScanningRef.current = true // Ahora sí creemos que es scanner

        // Si el usuario está en un input y detectamos escaneo, prevenir que se escriba
        if (isInputElement && isScanningRef.current && preventDefault) {
          event.preventDefault()
        }

        // Renovar timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          clearBuffer()
        }, 500)

        // Verificar si excedemos longitud máxima
        if (bufferRef.current.length > maxLength) {
          clearBuffer()
        }
      } else {
        // Entrada lenta - es humano escribiendo, limpiar y empezar de nuevo
        clearBuffer()
        bufferRef.current = key
        lastKeyTimeRef.current = now

        // Nuevo timeout
        timeoutRef.current = setTimeout(() => {
          clearBuffer()
        }, 500)
      }
    }

    // Usar capture phase para interceptar antes que otros handlers
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
