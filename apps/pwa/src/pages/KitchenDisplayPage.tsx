import { useQuery } from '@tanstack/react-query'
import { Clock, UtensilsCrossed, CheckCircle2 } from 'lucide-react'
import { kitchenService } from '@/services/kitchen.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function KitchenDisplayPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: () => kitchenService.getKitchenOrders(),
    staleTime: 1000 * 10, // 10 segundos
    refetchInterval: 1000 * 10, // Refrescar cada 10 segundos
  })

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getTimeColor = (minutes: number) => {
    if (minutes < 15) return 'text-green-600'
    if (minutes < 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Cocina - Órdenes Activas</h1>
        <p className="text-muted-foreground">
          {orders?.length || 0} orden(es) en preparación
        </p>
      </div>

      {orders && orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg text-muted-foreground">No hay órdenes activas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders?.map((order) => (
            <Card
              key={order.id}
              className={cn(
                'transition-all hover:shadow-lg',
                order.elapsed_time > 30 && 'border-red-500 border-2'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Mesa {order.table_number}
                    </CardTitle>
                    {order.table_name && (
                      <p className="text-sm text-muted-foreground">
                        {order.table_name}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {order.order_number}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Clock
                    className={cn('w-4 h-4', getTimeColor(order.elapsed_time))}
                  />
                  <span className={cn('text-sm font-medium', getTimeColor(order.elapsed_time))}>
                    {formatTime(order.elapsed_time)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'p-2 rounded border',
                        item.status === 'ready' && 'bg-green-50 border-green-200',
                        item.status === 'preparing' && 'bg-yellow-50 border-yellow-200'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">x{item.qty}</span>
                            <span>{item.product_name}</span>
                          </div>
                          {item.note && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              Nota: {item.note}
                            </p>
                          )}
                        </div>
                        {item.status === 'ready' && (
                          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
