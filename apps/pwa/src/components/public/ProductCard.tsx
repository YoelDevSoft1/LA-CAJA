import { Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { PublicProduct } from '@/services/public-menu.service'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: PublicProduct
  onAddToCart: () => void
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        !product.is_available && 'opacity-60'
      )}
    >
      <CardContent className="p-4">
        {/* Imagen del producto (placeholder por ahora) */}
        <div className="w-full h-48 bg-muted rounded-lg mb-3 flex items-center justify-center">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="text-muted-foreground text-sm">Sin imagen</div>
          )}
        </div>

        {/* Información del producto */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
            {!product.is_available && (
              <Badge variant="secondary" className="ml-2">
                <AlertCircle className="w-3 h-3 mr-1" />
                Agotado
              </Badge>
            )}
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-lg font-bold text-primary">
                ${product.price_usd.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Bs. {product.price_bs.toFixed(2)}
              </p>
            </div>

            <Button
              size="sm"
              onClick={onAddToCart}
              disabled={!product.is_available}
              className="shrink-0"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
