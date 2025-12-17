import { useState } from 'react'
import { useDemandPrediction } from '@/hooks/useDemandPrediction'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, RefreshCw, AlertCircle } from 'lucide-react'
import { formatConfidenceScore, getConfidenceColor } from '@/utils/ml-formatters'
import { format } from 'date-fns'

interface DemandPredictionCardProps {
  productId: string
  productName?: string
  onUpdate?: () => void
}

export default function DemandPredictionCard({
  productId,
  onUpdate,
}: DemandPredictionCardProps) {
  const [daysAhead, setDaysAhead] = useState(7)

  const { data, isLoading, error, refetch } = useDemandPrediction(
    productId,
    daysAhead,
  )

  const handleRefresh = () => {
    refetch()
    onUpdate?.()
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <p>Error al cargar la predicción</p>
          </div>
          <Button onClick={handleRefresh} className="mt-4" variant="outline">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  const predictions = data?.predictions || []
  const maxQuantity = Math.max(
    ...predictions.map((p) => p.predicted_quantity),
    0,
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Predicción de Demanda
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
        <div className="mt-4">
          <Label htmlFor="daysAhead">Días hacia adelante</Label>
          <Input
            id="daysAhead"
            type="number"
            min="1"
            max="90"
            value={daysAhead}
            onChange={(e) => setDaysAhead(Math.max(1, Math.min(90, parseInt(e.target.value) || 7)))}
            className="mt-2 w-32"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-8" />
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No hay datos históricos suficientes para generar una predicción
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Gráfico simple de barras */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Predicciones</h4>
              <div className="h-64 flex items-end justify-between gap-1 overflow-x-auto pb-4">
                {predictions.map((prediction, index) => {
                  const height = maxQuantity > 0 ? (prediction.predicted_quantity / maxQuantity) * 100 : 0
                  const confidenceColor = getConfidenceColor(prediction.confidence_score)
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center min-w-[60px]"
                    >
                      <div
                        className="w-full bg-primary rounded-t hover:bg-primary/80 transition-colors cursor-pointer relative group"
                        style={{ height: `${height}%` }}
                        title={`${format(new Date(prediction.date), 'dd/MM/yyyy')}: ${prediction.predicted_quantity.toFixed(0)} unidades`}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                          {prediction.predicted_quantity.toFixed(0)} unidades
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {format(new Date(prediction.date), 'dd/MM')}
                      </p>
                      <Badge
                        variant="secondary"
                        className={`text-xs mt-1 ${confidenceColor}`}
                      >
                        {Math.round(prediction.confidence_score)}%
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Métricas */}
            {data?.metrics && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-2">Métricas del Modelo</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">MAE</p>
                    <p className="font-semibold">{data.metrics.mae.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">RMSE</p>
                    <p className="font-semibold">{data.metrics.rmse.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">MAPE</p>
                    <p className="font-semibold">{data.metrics.mape.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">R²</p>
                    <p className="font-semibold">{data.metrics.r2.toFixed(3)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Resumen */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Promedio de confianza:</span>
                <span className="font-semibold">
                  {formatConfidenceScore(
                    predictions.reduce((sum, p) => sum + p.confidence_score, 0) /
                      predictions.length,
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">Modelo usado:</span>
                <span className="font-semibold">{predictions[0]?.model_used || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

