import { useState } from 'react'
import { X, Plus, Minus, ShoppingCart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useMutation } from '@tanstack/react-query'
import { publicMenuService } from '@/services/public-menu.service'
import toast from 'react-hot-toast'
import type { PublicProduct } from '@/services/public-menu.service'

interface CartItem {
  product: PublicProduct
  quantity: number
}

interface OrderCartProps {
  items: CartItem[]
  onRemove: (productId: string) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onClose: () => void
  tableId: string // TODO: Usar tableId cuando se implemente la funcionalidad
  qrCode: string
}

export default function OrderCart({
  items,
  onRemove,
  onUpdateQuantity,
  onClose,
  tableId: _tableId, // TODO: Usar tableId cuando se implemente la funcionalidad
  qrCode,
}: OrderCartProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const total = items.reduce((sum, item) => {
    return sum + item.product.price_usd * item.quantity
  }, 0)

  const totalBs = items.reduce((sum, item) => {
    return sum + item.product.price_bs * item.quantity
  }, 0)

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      // Crear orden con los items del carrito usando el servicio público
      const result = await publicMenuService.createOrder(
        qrCode,
        items.map((item) => ({
          product_id: item.product.id,
          qty: item.quantity,
        }))
      )

      return result
    },
    onSuccess: () => {
      toast.success('¡Pedido enviado! Te notificaremos cuando esté listo.')
      // Limpiar carrito
      items.forEach((item) => onRemove(item.product.id))
      onClose()
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al enviar el pedido. Intenta nuevamente.'
      )
    },
  })

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('El carrito está vacío')
      return
    }

    setIsSubmitting(true)
    try {
      await createOrderMutation.mutateAsync()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          <h2 className="font-semibold text-lg">Mi Pedido</h2>
          {items.length > 0 && (
            <Badge variant="secondary">{items.length}</Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Items */}
      <ScrollArea className="flex-1 p-4">
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Tu carrito está vacío</p>
            <p className="text-sm mt-2">Agrega productos del menú</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex items-start gap-3 p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{item.product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    ${item.product.price_usd.toFixed(2)} c/u
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      onUpdateQuantity(item.product.id, item.quantity - 1)
                    }
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      onUpdateQuantity(item.product.id, item.quantity + 1)
                    }
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                <div className="text-right min-w-[80px]">
                  <p className="font-semibold">
                    ${(item.product.price_usd * item.quantity).toFixed(2)}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onRemove(item.product.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer con total y botón */}
      {items.length > 0 && (
        <div className="p-4 border-t space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total:</span>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">
                ${total.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Bs. {totalBs.toFixed(2)}
              </p>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting || createOrderMutation.isPending}
          >
            {isSubmitting || createOrderMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Pedido'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
