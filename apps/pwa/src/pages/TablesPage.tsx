import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Square, Grid3x3, LayoutGrid } from 'lucide-react'
import { Table } from '@/services/tables.service'
import { ordersService, Order } from '@/services/orders.service'
import toast from 'react-hot-toast'
import TablesGrid from '@/components/tables/TablesGrid'
import FloorPlanView from '@/components/tables/FloorPlanView'
import OrderModal from '@/components/tables/OrderModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TablesPage() {
  const queryClient = useQueryClient()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'floor'>('grid')

  const { data: openOrders } = useQuery({
    queryKey: ['orders', 'open'],
    queryFn: () => ordersService.getOpenOrders(),
    staleTime: 1000 * 30, // 30 segundos
    refetchInterval: 1000 * 30, // Refrescar cada 30 segundos
  })

  const createOrderMutation = useMutation({
    mutationFn: (tableId: string | null) =>
      ordersService.createOrder({ table_id: tableId }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'open'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      toast.success('Orden creada correctamente')
      setSelectedOrder(order)
      setIsOrderModalOpen(true)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear la orden')
    },
  })

  const handleTableClick = (table: Table) => {
    // Si la mesa tiene una orden abierta, abrirla
    if (table.current_order_id) {
      const order = openOrders?.find((o: Order) => o.id === table.current_order_id)
      if (order) {
        setSelectedOrder(order)
        setIsOrderModalOpen(true)
      }
    } else {
      // Si no tiene orden, crear una nueva
      createOrderMutation.mutate(table.id)
    }
  }

  const handleCreateOrder = (tableId: string | null) => {
    createOrderMutation.mutate(tableId)
  }

  const handleOrderUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['orders', 'open'] })
    queryClient.invalidateQueries({ queryKey: ['tables'] })
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl sm:text-2xl flex items-center">
              <Square className="w-6 h-6 sm:w-7 sm:h-7 text-primary mr-2" />
              Mesas y Órdenes
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'floor' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('floor')}
              >
                <Grid3x3 className="w-4 h-4 mr-2" />
                Plano
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'grid' ? (
            <TablesGrid
              onTableClick={handleTableClick}
              onCreateOrder={handleCreateOrder}
            />
          ) : (
            <FloorPlanView
              onTableClick={handleTableClick}
              onCreateOrder={handleCreateOrder}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal de orden */}
      {selectedOrder && (
        <OrderModal
          isOpen={isOrderModalOpen}
          onClose={() => {
            setIsOrderModalOpen(false)
            setSelectedOrder(null)
          }}
          order={selectedOrder}
          onOrderUpdated={handleOrderUpdated}
        />
      )}
    </div>
  )
}

