import { useEffect, useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { realtimeAnalyticsService } from '@/services/realtime-analytics.service'
import { realtimeWebSocketService } from '@/services/realtime-websocket.service'
import { RealTimeMetric, MetricType } from '@/types/realtime-analytics.types'

export function useRealtimeMetrics(metricTypes?: MetricType[]) {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)

  // Obtener métricas iniciales desde API REST
  const {
    data: initialMetrics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['realtime-metrics', metricTypes],
    queryFn: () => realtimeAnalyticsService.getMetrics(metricTypes),
    staleTime: 1000 * 60, // 1 minuto
    refetchInterval: 1000 * 60 * 5, // Refrescar cada 5 minutos como fallback
  })

  // Estado local para métricas actualizadas vía WebSocket
  const [metrics, setMetrics] = useState<RealTimeMetric[]>(
    initialMetrics?.metrics || [],
  )

  // Callback para actualizaciones de métricas
  const handleMetricUpdate = useCallback(
    (metric: RealTimeMetric) => {
      setMetrics((prev) => {
        const index = prev.findIndex((m) => m.metric_type === metric.metric_type)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = metric
          return updated
        }
        return [...prev, metric]
      })

      // Actualizar cache de React Query
      queryClient.setQueryData(['realtime-metrics', metricTypes], (old: any) => {
        if (!old) return { metrics: [metric], calculated_at: new Date().toISOString() }
        const index = old.metrics.findIndex(
          (m: RealTimeMetric) => m.metric_type === metric.metric_type,
        )
        if (index >= 0) {
          const updated = { ...old }
          updated.metrics[index] = metric
          return updated
        }
        return {
          ...old,
          metrics: [...old.metrics, metric],
        }
      })
    },
    [metricTypes, queryClient],
  )

  // Conectar WebSocket y suscribirse
  useEffect(() => {
    // Conectar
    realtimeWebSocketService.connect()

    // Verificar conexión y suscribirse cuando esté lista
    const checkConnection = setInterval(() => {
      const connected = realtimeWebSocketService.connected
      setIsConnected(connected)
      
      // Suscribirse cuando se conecte
      if (connected) {
        realtimeWebSocketService.subscribeToMetrics(metricTypes)
      }
    }, 1000)

    // Registrar callback
    const unsubscribe = realtimeWebSocketService.onMetricUpdate(handleMetricUpdate)

    // Cleanup
    return () => {
      clearInterval(checkConnection)
      unsubscribe()
    }
  }, [metricTypes, handleMetricUpdate])

  // Actualizar métricas cuando cambian los datos iniciales
  useEffect(() => {
    if (initialMetrics?.metrics) {
      setMetrics(initialMetrics.metrics)
    }
  }, [initialMetrics])

  return {
    metrics,
    isLoading,
    error,
    isConnected,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['realtime-metrics'] }),
  }
}

