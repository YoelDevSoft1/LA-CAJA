import { useState, useMemo } from 'react'
import { Search, Filter, ShoppingCart } from 'lucide-react'
import { type PublicTableInfo, type PublicMenuResponse, type PublicProduct } from '@/services/public-menu.service'
import ProductCard from './ProductCard'
import OrderCart from './OrderCart'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface MenuViewerProps {
  tableId: string
  tableInfo: PublicTableInfo
  menu: PublicMenuResponse
  qrCode: string
}

type FilterType = 'all' | 'available' | 'vegetarian' | 'gluten-free'

export default function MenuViewer({
  tableId,
  tableInfo,
  menu,
  qrCode,
}: MenuViewerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [showCart, setShowCart] = useState(false)
  const [cartItems, setCartItems] = useState<Array<{
    product: PublicProduct
    quantity: number
  }>>([])

  // Extraer todas las categorías
  const categories = useMemo(() => {
    return menu.categories.map((cat) => cat.name)
  }, [menu])

  // Filtrar productos según búsqueda, categoría y filtros
  const filteredCategories = useMemo(() => {
    return menu.categories
      .map((category) => ({
        ...category,
        products: category.products.filter((product) => {
          // Filtro de búsqueda
          const matchesSearch =
            searchQuery === '' ||
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase())

          // Filtro de categoría
          const matchesCategory =
            selectedCategory === null || category.name === selectedCategory

          // Filtro de disponibilidad
          const matchesAvailability =
            filter === 'all' ||
            (filter === 'available' && product.is_available)

          // Filtros especiales (por ahora solo disponibles, se pueden extender)
          // TODO: Agregar campos vegetarian, gluten_free a productos

          return matchesSearch && matchesCategory && matchesAvailability
        }),
      }))
      .filter((category) => category.products.length > 0)
  }, [menu, searchQuery, selectedCategory, filter])

  const totalCartItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }, [cartItems])

  const handleAddToCart = (product: PublicProduct) => {
    if (!product.is_available) return

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    setShowCart(true)
  }

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId)
      return
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Mesa {tableInfo.table_number}</h1>
              {tableInfo.name && (
                <p className="text-sm text-muted-foreground">{tableInfo.name}</p>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={() => setShowCart(!showCart)}
            >
              <ShoppingCart className="w-5 h-5" />
              {totalCartItems > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {totalCartItems}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Contenido principal */}
          <div className={cn('flex-1 transition-all', showCart && 'lg:mr-80')}>
            {/* Barra de búsqueda y filtros */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  Todas
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Todos
                </Button>
                <Button
                  variant={filter === 'available' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('available')}
                >
                  Disponibles
                </Button>
              </div>
            </div>

            {/* Lista de productos */}
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-8">
                {filteredCategories.map((category) => (
                  <div key={category.name}>
                    <h2 className="text-2xl font-bold mb-4">{category.name}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={() => handleAddToCart(product)}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {filteredCategories.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      No se encontraron productos con los filtros seleccionados.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Carrito lateral */}
          {showCart && (
            <div className="hidden lg:block fixed right-0 top-0 h-screen w-80 bg-background border-l shadow-lg z-40">
              <OrderCart
                items={cartItems}
                onRemove={handleRemoveFromCart}
                onUpdateQuantity={handleUpdateQuantity}
                onClose={() => setShowCart(false)}
                tableId={tableId}
                qrCode={qrCode}
              />
            </div>
          )}
        </div>
      </div>

      {/* Carrito móvil (bottom sheet) */}
      {showCart && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 bg-background border-t shadow-lg z-50 max-h-[80vh]">
          <OrderCart
            items={cartItems}
            onRemove={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateQuantity}
            onClose={() => setShowCart(false)}
            tableId={tableId}
            qrCode={qrCode}
          />
        </div>
      )}
    </div>
  )
}
