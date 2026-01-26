import { useRef, useEffect, useState, useMemo } from 'react'
import { Package, Coffee, Apple, Beef, Shirt, Home, Cpu, Pill, ShoppingBag, Scale, Search, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Definición de tipos mínimos necesarios si no se importan de /services
interface Product {
    id: string
    name: string
    price_bs: number
    price_usd: number
    category?: string | null
    image_url?: string | null
    is_weight_product?: boolean
    weight_unit?: string | null
    price_per_weight_bs?: number
    price_per_weight_usd?: number
    barcode?: string | null
    low_stock_threshold?: number
}

interface ProductCatalogProps {
    products: Product[]
    isLoading: boolean
    isError: boolean
    searchQuery: string
    lowStockIds: Set<string>
    onProductClick: (product: Product) => void
}

export function ProductCatalog({
    products,
    isLoading,
    isError,
    searchQuery,
    lowStockIds,
    onProductClick
}: ProductCatalogProps) {
    const listViewportRef = useRef<HTMLDivElement | null>(null)
    const [listScrollTop, setListScrollTop] = useState(0)
    const [listViewportHeight, setListViewportHeight] = useState(0)

    // Lógica de virtualización
    useEffect(() => {
        if (!listViewportRef.current) return
        const updateHeight = () => {
            setListViewportHeight(listViewportRef.current?.clientHeight || 0)
        }
        updateHeight()

        const observer = new ResizeObserver(updateHeight)
        observer.observe(listViewportRef.current)
        return () => observer.disconnect()
    }, [])

    const PRODUCT_ROW_HEIGHT = 104
    const PRODUCT_OVERSCAN = 6
    // Altura mínima para asegurar scroll si hay pocos productos pero llenan pantalla
    const listTotalHeight = Math.max(products.length * PRODUCT_ROW_HEIGHT, listViewportHeight + 1)

    const startIndex = Math.max(
        0,
        Math.floor(listScrollTop / PRODUCT_ROW_HEIGHT) - PRODUCT_OVERSCAN
    )
    const endIndex = Math.min(
        products.length,
        Math.ceil((listScrollTop + listViewportHeight) / PRODUCT_ROW_HEIGHT) + PRODUCT_OVERSCAN
    )

    const visibleProducts = useMemo(
        () => products.slice(startIndex, endIndex).map((product, index) => ({
            product,
            originalIndex: startIndex + index
        })),
        [products, startIndex, endIndex]
    )

    // Helper de iconos (extraído de POSPage para mantener consistencia)
    const getCategoryIcon = (category?: string | null) => {
        if (!category) return Package
        const normalized = category.toLowerCase()

        if (normalized.includes('bebida') || normalized.includes('drink') || normalized.includes('refresco')) return Coffee
        if (normalized.includes('fruta') || normalized.includes('verdura') || normalized.includes('vegetal')) return Apple
        if (normalized.includes('carne') || normalized.includes('pollo') || normalized.includes('proteina')) return Beef
        if (normalized.includes('ropa') || normalized.includes('vestir') || normalized.includes('moda')) return Shirt
        if (normalized.includes('hogar') || normalized.includes('casa')) return Home
        if (normalized.includes('electron') || normalized.includes('tecno') || normalized.includes('gadget')) return Cpu
        if (normalized.includes('farmacia') || normalized.includes('salud') || normalized.includes('medic')) return Pill
        if (normalized.includes('accesorio') || normalized.includes('general')) return ShoppingBag

        return Package
    }

    if (isLoading && products.length === 0) {
        return (
            <div className="grid grid-cols-1 gap-2 p-1">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[60%]" />
                            <Skeleton className="h-3 w-[40%]" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (isError || (products.length === 0 && searchQuery.length >= 2)) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground bg-muted/10 rounded-xl border border-border/50 p-6 text-center">
                {isError ? (
                    <>
                        <WifiOff className="w-12 h-12 mb-3 opacity-50" />
                        <p className="font-medium">Error al cargar productos</p>
                        <p className="text-sm mt-1">Verifica tu conexión e intenta de nuevo</p>
                    </>
                ) : (
                    <>
                        <Search className="w-12 h-12 mb-3 opacity-50" />
                        <p className="font-medium">No se encontraron productos</p>
                        <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
                    </>
                )}
            </div>
        )
    }

    if (products.length === 0 && searchQuery.length < 2) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center bg-muted/5 rounded-xl border border-dashed border-border/60">
                <Search className="w-10 h-10 mb-3 opacity-30" />
                <p className="font-medium">Empieza a escribir para buscar</p>
                <p className="text-xs mt-1 max-w-[200px]">
                    Busca por nombre, código de barras o categoría
                </p>
            </div>
        )
    }

    return (
        <div className="flex-1 min-h-0 relative bg-background/50 rounded-xl border border-border/50 overflow-hidden shadow-inner">
            <ScrollArea
                className="h-full"
                viewportRef={listViewportRef}
                onScroll={(e) => {
                    const target = e.currentTarget as HTMLDivElement
                    setListScrollTop(target.scrollTop)
                }}
            >
                <div
                    style={{ height: listTotalHeight }}
                    className="relative w-full"
                >
                    {visibleProducts.map(({ product, originalIndex }) => {
                        const CategoryIcon = getCategoryIcon(product.category)
                        const isLowStock = lowStockIds.has(product.id)

                        return (
                            <div
                                key={product.id}
                                className="absolute left-0 right-0 px-2"
                                style={{
                                    top: originalIndex * PRODUCT_ROW_HEIGHT,
                                    height: PRODUCT_ROW_HEIGHT
                                }}
                            >
                                <button
                                    onClick={() => onProductClick(product)}
                                    className="w-full h-[96px] mt-1 text-left group relative bg-card hover:bg-muted/50 transition-all duration-200 rounded-xl border border-border/60 hover:border-primary/30 hover:shadow-md overflow-hidden p-3 sm:p-4 flex items-center gap-3 sm:gap-4 active:scale-[0.99]"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-0 bg-primary opacity-0 group-hover:opacity-100 group-hover:w-1 transition-all duration-200" />

                                    {/* Icono / Imagen */}
                                    <div className={cn(
                                        "w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors shadow-sm",
                                        isLowStock ? "bg-warning/10 text-warning border border-warning/20" : "bg-primary/5 text-primary group-hover:bg-primary/10 border border-primary/10"
                                    )}>
                                        {product.is_weight_product ? (
                                            <Scale className="w-6 h-6 sm:w-7 sm:h-7" />
                                        ) : (
                                            <CategoryIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center h-full py-0.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-semibold text-sm sm:text-base text-foreground -mt-0.5 leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                                {product.name}
                                            </h3>
                                            {isLowStock && (
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-warning/5 text-warning border-warning/30 flex-shrink-0 animate-pulse">
                                                    Bajo Stock
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mt-auto">
                                            {product.category && (
                                                <span className="text-xs text-muted-foreground truncate max-w-[100px] hidden sm:inline-block bg-muted/50 px-1.5 py-0.5 rounded-md">
                                                    {product.category}
                                                </span>
                                            )}
                                            {product.barcode && (
                                                <span className="text-[10px] text-muted-foreground/60 font-mono hidden sm:inline-block truncate">
                                                    {product.barcode}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Precio */}
                                    <div className="text-right flex-shrink-0 flex flex-col justify-center h-full bg-muted/20 px-3 -my-4 -mr-4 py-4 border-l border-border/30 w-24 sm:w-28 group-hover:bg-primary/5 transition-colors">
                                        <div className="flex flex-col items-end">
                                            {product.is_weight_product ? (
                                                <Badge variant="secondary" className="mb-1 text-[9px] h-4 px-1">
                                                    /{product.weight_unit || 'kg'}
                                                </Badge>
                                            ) : null}
                                            <span className="font-bold text-base sm:text-lg text-primary tabular-nums tracking-tight">
                                                ${Number(product.is_weight_product ? product.price_per_weight_usd : product.price_usd || 0).toFixed(2)}
                                            </span>
                                            <span className="text-[10px] sm:text-xs text-muted-foreground font-medium tabular-nums">
                                                Bs {Number(product.is_weight_product ? product.price_per_weight_bs : product.price_bs || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
        </div>
    )
}
