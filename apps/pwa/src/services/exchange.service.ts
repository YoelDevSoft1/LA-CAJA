import { api } from '@/lib/api'
import { db } from '@/db/database'

// ============================================
// TIPOS
// ============================================

export type ExchangeRateType = 'BCV' | 'PARALLEL' | 'CASH' | 'ZELLE'

export interface BCVRateResponse {
  rate: number | null
  source: 'api' | 'manual' | null
  timestamp: string | null
  available: boolean
  message?: string
}

export interface MultiRateResponse {
  bcv: number | null
  parallel: number | null
  cash: number | null
  zelle: number | null
  updated_at: string | null
}

export interface RateConfig {
  cash_usd_rate_type: ExchangeRateType
  cash_bs_rate_type: ExchangeRateType
  pago_movil_rate_type: ExchangeRateType
  transfer_rate_type: ExchangeRateType
  point_of_sale_rate_type: ExchangeRateType
  zelle_rate_type: ExchangeRateType
  rounding_mode: 'UP' | 'DOWN' | 'NEAREST' | 'BANKER'
  rounding_precision: number
  prefer_change_in: 'USD' | 'BS' | 'SAME'
  auto_convert_small_change: boolean
  small_change_threshold_usd: number
  allow_overpayment: boolean
  max_overpayment_usd: number
  overpayment_action: 'CHANGE' | 'CREDIT' | 'TIP' | 'REJECT'
}

export interface SetRateInput {
  rate: number
  rate_type?: ExchangeRateType
  is_preferred?: boolean
  note?: string
}

// ============================================
// UTILIDADES MATEMÁTICAS (FRONTEND)
// ============================================

/**
 * Convierte un monto decimal a centavos (evita errores de punto flotante)
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Convierte centavos a monto decimal
 */
export function fromCents(cents: number): number {
  return cents / 100
}

/**
 * Convierte USD a BS usando la tasa proporcionada
 */
export function usdToBs(amountUsd: number, rate: number): number {
  if (!rate || rate <= 0) {
    throw new Error(`Tasa de cambio inválida: ${rate}`)
  }
  return Math.round(amountUsd * rate * 100) / 100
}

/**
 * Convierte BS a USD usando la tasa proporcionada
 */
export function bsToUsd(amountBs: number, rate: number): number {
  if (!rate || rate <= 0) {
    throw new Error(`Tasa de cambio inválida: ${rate}`)
  }
  return Math.round((amountBs / rate) * 100) / 100
}

/**
 * Redondeo bancario (IEEE 754)
 */
export function bankerRound(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals)
  const scaled = value * factor
  const truncated = Math.trunc(scaled)
  const remainder = scaled - truncated

  if (Math.abs(remainder - 0.5) < 0.0000001) {
    if (truncated % 2 === 0) {
      return truncated / factor
    } else {
      return (truncated + 1) / factor
    }
  }
  return Math.round(value * factor) / factor
}

/**
 * Calcula el desglose óptimo de billetes para cambio en Bs
 */
export function calculateBsChangeBreakdown(changeBs: number): {
  bills: Array<{ denomination: number; count: number; subtotal: number }>
  total_bs: number
  excess_cents: number
  excess_bs: number
} {
  const denominations = [500, 200, 100, 50, 20, 10, 5, 1]
  let remaining = toCents(changeBs)
  const bills: Array<{ denomination: number; count: number; subtotal: number }> = []

  for (const denom of denominations) {
    const count = Math.floor(remaining / 100 / denom)
    if (count > 0) {
      bills.push({
        denomination: denom,
        count,
        subtotal: denom * count,
      })
      remaining -= count * denom * 100
    }
  }

  return {
    bills,
    total_bs: changeBs,
    excess_cents: remaining,
    excess_bs: fromCents(remaining),
  }
}

// ============================================
// CLAVES DE CACHE
// ============================================

const EXCHANGE_RATE_KEY = 'bcv_exchange_rate'
const EXCHANGE_RATE_TIMESTAMP_KEY = 'bcv_exchange_rate_timestamp'
const ALL_RATES_KEY = 'all_exchange_rates'
const RATE_CONFIG_KEY = 'rate_config'

// ============================================
// SERVICIO
// ============================================

export const exchangeService = {
  // ============================================
  // MÉTODOS MULTI-TASA
  // ============================================

  /**
   * Obtiene todas las tasas activas
   */
  async getAllRates(): Promise<{ rates: MultiRateResponse; available: boolean }> {
    const isOnline = navigator.onLine

    if (!isOnline) {
      try {
        const cached = await db.kv.get(ALL_RATES_KEY)
        if (cached?.value) {
          return { rates: cached.value, available: true }
        }
      } catch (error) {
        console.error('Error obteniendo tasas del cache:', error)
      }
      return {
        rates: { bcv: null, parallel: null, cash: null, zelle: null, updated_at: null },
        available: false,
      }
    }

    try {
      const response = await api.get<{ rates: MultiRateResponse; available: boolean }>(
        '/exchange/rates'
      )

      // Guardar en cache
      if (response.data.available && response.data.rates) {
        try {
          await db.kv.put({ key: ALL_RATES_KEY, value: response.data.rates })
          console.log('[Exchange] ✅ Tasas guardadas en cache:', response.data.rates)
        } catch (error) {
          console.error('[Exchange] Error guardando tasas:', error)
        }
      }

      return response.data
    } catch (error: any) {
      // Fallback a cache
      try {
        const cached = await db.kv.get(ALL_RATES_KEY)
        if (cached?.value) {
          return { rates: cached.value, available: true }
        }
      } catch (cacheError) {
        console.error('Error accediendo cache de tasas:', cacheError)
      }

      return {
        rates: { bcv: null, parallel: null, cash: null, zelle: null, updated_at: null },
        available: false,
      }
    }
  },

  /**
   * Obtiene tasa por tipo específico
   */
  async getRateByType(
    rateType: ExchangeRateType
  ): Promise<{ rate: number | null; available: boolean }> {
    try {
      const response = await api.get<{ rate: number | null; available: boolean }>(
        `/exchange/rates/${rateType.toLowerCase()}`
      )
      return response.data
    } catch (error) {
      // Fallback a tasas cacheadas
      const allRates = await this.getAllRates()
      const key = rateType.toLowerCase() as keyof MultiRateResponse
      const rate = allRates.rates[key] as number | null
      return { rate, available: rate !== null }
    }
  },

  /**
   * Obtiene la tasa apropiada para un método de pago
   */
  async getRateForPaymentMethod(
    method: string
  ): Promise<{ rate: number | null; rate_type: ExchangeRateType | null; available: boolean }> {
    try {
      const response = await api.get<{
        rate: number | null
        rate_type: ExchangeRateType | null
        available: boolean
      }>(`/exchange/rates/for-method/${method}`)
      return response.data
    } catch (error) {
      // Fallback: usar BCV
      const bcv = await this.getBCVRate()
      return {
        rate: bcv.rate,
        rate_type: 'BCV',
        available: bcv.available,
      }
    }
  },

  /**
   * Establece múltiples tasas a la vez
   */
  async setMultipleRates(
    rates: SetRateInput[]
  ): Promise<{ rates: any[]; success: boolean }> {
    const response = await api.post<{ rates: any[] }>('/exchange/rates/bulk', { rates })

    // Invalidar cache
    await this.invalidateCache()

    return { rates: response.data.rates, success: true }
  },

  /**
   * Establece una tasa individual
   */
  async setRate(input: SetRateInput): Promise<any> {
    const response = await api.post('/exchange/bcv/manual', input)
    await this.invalidateCache()
    return response.data
  },

  // ============================================
  // CONFIGURACIÓN
  // ============================================

  /**
   * Obtiene la configuración de tasas de la tienda
   */
  async getRateConfig(): Promise<RateConfig | null> {
    const isOnline = navigator.onLine

    if (!isOnline) {
      try {
        const cached = await db.kv.get(RATE_CONFIG_KEY)
        if (cached?.value) {
          return cached.value
        }
      } catch (error) {
        console.error('Error obteniendo config del cache:', error)
      }
      return null
    }

    try {
      const response = await api.get<{ config: RateConfig }>('/exchange/config')

      // Guardar en cache
      try {
        await db.kv.put({ key: RATE_CONFIG_KEY, value: response.data.config })
      } catch (error) {
        console.error('Error guardando config:', error)
      }

      return response.data.config
    } catch (error) {
      // Fallback a cache
      try {
        const cached = await db.kv.get(RATE_CONFIG_KEY)
        if (cached?.value) {
          return cached.value
        }
      } catch (cacheError) {
        console.error('Error accediendo cache de config:', cacheError)
      }
      return null
    }
  },

  /**
   * Actualiza la configuración de tasas
   */
  async updateRateConfig(updates: Partial<RateConfig>): Promise<RateConfig | null> {
    try {
      const response = await api.put<{ config: RateConfig }>('/exchange/config', updates)

      // Actualizar cache
      try {
        await db.kv.put({ key: RATE_CONFIG_KEY, value: response.data.config })
      } catch (error) {
        console.error('Error actualizando cache de config:', error)
      }

      return response.data.config
    } catch (error) {
      console.error('Error actualizando config:', error)
      return null
    }
  },

  // ============================================
  // MÉTODOS ORIGINALES (COMPATIBILIDAD)
  // ============================================

  async getBCVRate(force = false): Promise<BCVRateResponse> {
    const isOnline = navigator.onLine

    // Si está offline, intentar obtener del cache local
    if (!isOnline) {
      try {
        const cachedRate = await db.kv.get(EXCHANGE_RATE_KEY)
        const cachedTimestamp = await db.kv.get(EXCHANGE_RATE_TIMESTAMP_KEY)

        if (cachedRate?.value && cachedTimestamp?.value) {
          return {
            rate: cachedRate.value,
            source: 'api',
            timestamp: cachedTimestamp.value,
            available: true,
            message: 'Tasa obtenida del cache local (modo offline)',
          }
        }

        return {
          rate: null,
          source: null,
          timestamp: null,
          available: false,
          message: 'No hay tasa de cambio guardada. Necesitas conexión para obtenerla.',
        }
      } catch (error) {
        console.error('Error obteniendo tasa del cache:', error)
        return {
          rate: null,
          source: null,
          timestamp: null,
          available: false,
          message: 'Error al acceder al cache local',
        }
      }
    }

    // Si está online, obtener del API
    try {
      const response = await api.get<BCVRateResponse>('/exchange/bcv', {
        params: force ? { force: 'true' } : {},
      })

      // Guardar en cache local
      if (response.data.available && response.data.rate) {
        try {
          await Promise.all([
            db.kv.put({ key: EXCHANGE_RATE_KEY, value: response.data.rate }),
            db.kv.put({
              key: EXCHANGE_RATE_TIMESTAMP_KEY,
              value: response.data.timestamp || new Date().toISOString(),
            }),
          ])
          console.log('[Exchange] ✅ Tasa BCV guardada en IndexedDB:', response.data.rate)
        } catch (error) {
          console.error('[Exchange] ❌ Error guardando tasa en IndexedDB:', error)
        }
      }

      return response.data
    } catch (error: any) {
      // Si falla pero tenemos cache, usar el cache
      if (!force) {
        try {
          const cachedRate = await db.kv.get(EXCHANGE_RATE_KEY)
          const cachedTimestamp = await db.kv.get(EXCHANGE_RATE_TIMESTAMP_KEY)

          if (cachedRate?.value && cachedTimestamp?.value) {
            return {
              rate: cachedRate.value,
              source: 'api',
              timestamp: cachedTimestamp.value,
              available: true,
              message: 'Tasa obtenida del cache local (fallo de conexión)',
            }
          }
        } catch (cacheError) {
          console.error('Error obteniendo tasa del cache después de fallo:', cacheError)
        }
      }

      return {
        rate: null,
        source: null,
        timestamp: null,
        available: false,
        message: error.response?.data?.message || 'Error al obtener la tasa de cambio',
      }
    }
  },

  /**
   * Obtiene la tasa de cambio del cache local
   */
  async getCachedRate(): Promise<BCVRateResponse> {
    try {
      const cachedRate = await db.kv.get(EXCHANGE_RATE_KEY)
      const cachedTimestamp = await db.kv.get(EXCHANGE_RATE_TIMESTAMP_KEY)

      if (cachedRate?.value && cachedTimestamp?.value) {
        return {
          rate: cachedRate.value,
          source: 'api',
          timestamp: cachedTimestamp.value,
          available: true,
          message: 'Tasa obtenida del cache local',
        }
      }

      return {
        rate: null,
        source: null,
        timestamp: null,
        available: false,
        message: 'No hay tasa de cambio guardada en cache',
      }
    } catch (error) {
      console.error('Error obteniendo tasa del cache:', error)
      return {
        rate: null,
        source: null,
        timestamp: null,
        available: false,
        message: 'Error al acceder al cache local',
      }
    }
  },

  /**
   * Obtiene el historial de tasas
   */
  async getRateHistory(
    limit = 50,
    offset = 0,
    rateType?: ExchangeRateType
  ): Promise<{ rates: any[]; total: number }> {
    try {
      const params: Record<string, string> = {
        limit: limit.toString(),
        offset: offset.toString(),
      }
      if (rateType) {
        params.rate_type = rateType
      }

      const response = await api.get<{ rates: any[]; total: number }>(
        '/exchange/bcv/history',
        { params }
      )
      return response.data
    } catch (error) {
      console.error('Error obteniendo historial:', error)
      return { rates: [], total: 0 }
    }
  },

  /**
   * Invalida el cache de tasas
   */
  async invalidateCache(): Promise<void> {
    try {
      await Promise.all([
        db.kv.delete(EXCHANGE_RATE_KEY),
        db.kv.delete(EXCHANGE_RATE_TIMESTAMP_KEY),
        db.kv.delete(ALL_RATES_KEY),
        db.kv.delete(RATE_CONFIG_KEY),
      ])
      console.log('[Exchange] Cache invalidado')
    } catch (error) {
      console.error('Error invalidando cache:', error)
    }
  },
}
