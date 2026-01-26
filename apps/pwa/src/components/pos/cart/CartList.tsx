import { CartItem } from '@/stores/cart.store'
import { SwipeableItem } from '@/components/ui/swipeable-item'
import { Trash2, Scale, Minus, Plus, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCategoryIcon } from '@/components/pos/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CartListProps {
    items: CartItem[]
    isMobile: boolean
    invalidCartProductIds: string[]
    onUpdateQty: (id: string, qty: number) => void
    onRemoveItem: (id: string) => void
}

export function CartList({
    items,
    isMobile,
    invalidCartProductIds,
    onUpdateQty,
    onRemoveItem
}: CartListProps) {

    return (
        <div className="flex-1 min-h-0 relative">
            <ScrollArea className="h-full">
                <div className="flex flex-col">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 sm:py-20 text-muted-foreground px-4 text-center">
                            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                                <ShoppingCart className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="font-medium text-lg text-foreground">Tu carrito está vacío</p>
                            <p className="text-sm mt-1 max-w-[200px]">
                                Escanea un producto o búscalo en el catálogo
                            </p>
                        </div>
                    ) : (
                        items.map((item) => {
                            const isInvalid = invalidCartProductIds.includes(item.id)
                            const lineTotalUsd = item.is_weight_product
                                ? (item.qty * (item.price_per_weight_usd || 0)) - (item.discount_usd || 0)
                                : (item.qty * item.unit_price_usd) - (item.discount_usd || 0)

                            const lineTotalBs = item.is_weight_product
                                ? (item.qty * (item.price_per_weight_bs || 0)) - (item.discount_bs || 0)
                                : (item.qty * item.unit_price_bs) - (item.discount_bs || 0)

                            return (
                                <SwipeableItem
                                    key={item.id}
                                    onSwipeLeft={isMobile ? () => onRemoveItem(item.id) : undefined}
                                    leftAction={isMobile ? (
                                        <div className="flex items-center gap-2">
                                            <Trash2 className="w-4 h-4" />
                                            <span className="text-sm font-medium">Eliminar</span>
                                        </div>
                                    ) : undefined}
                                    enabled={isMobile}
                                    threshold={80}
                                    className="mb-0"
                                >
                                    <div
                                        className={cn(
                                            "group grid grid-cols-[auto_1fr_auto_auto_32px] gap-3 p-3 transition-all border-b border-border/40 hover:bg-muted/30 relative items-center",
                                            isInvalid && "bg-destructive/5"
                                        )}
                                    >
                                        {/* 1. Icono de Categoría */}
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                            isInvalid ? "bg-destructive/10 text-destructive" : "bg-primary/5 text-primary/70 group-hover:bg-primary/10 group-hover:text-primary"
                                        )}>
                                            {item.is_weight_product ? (
                                                <Scale className="w-5 h-5" />
                                            ) : (
                                                (() => {
                                                    const Icon = getCategoryIcon(item.category)
                                                    return <Icon className="w-5 h-5" />
                                                })()
                                            )}
                                        </div>

                                        {/* 2. Info Principal (Truncate Force) */}
                                        <div className="min-w-0 flex flex-col justify-center">
                                            <span className={cn(
                                                "font-semibold text-sm text-foreground truncate block w-full",
                                                isInvalid && "text-destructive"
                                            )} title={item.product_name}>
                                                {item.product_name}
                                            </span>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 truncate">
                                                <span className="font-mono tabular-nums opacity-80">
                                                    ${Number(item.price_per_weight_usd ?? item.unit_price_usd).toFixed(2)}
                                                </span>
                                                {item.is_weight_product && (
                                                    <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-medium flex-shrink-0">
                                                        /{item.weight_unit || 'kg'}
                                                    </span>
                                                )}
                                                {isInvalid && (
                                                    <span className="text-destructive font-medium text-[10px] flex-shrink-0">Inactivo</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 3. Stepper de Cantidad */}
                                        {!item.is_weight_product ? (
                                            <div className="flex items-center h-8 bg-background border border-border/60 rounded-full shadow-sm">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onUpdateQty(item.id, item.qty - 1)
                                                    }}
                                                    className="w-7 h-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                                                    disabled={item.qty <= 1}
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <div className="w-6 text-center font-semibold text-sm tabular-nums border-x border-border/30 h-4 flex items-center justify-center">
                                                    {item.qty}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onUpdateQty(item.id, item.qty + 1)
                                                    }}
                                                    className="w-7 h-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="px-3 py-1.5 rounded-full bg-muted/50 border border-border/40 text-xs font-semibold tabular-nums whitespace-nowrap">
                                                {item.qty} {item.weight_unit || 'kg'}
                                            </div>
                                        )}

                                        {/* 4. Precio Total */}
                                        <div className="text-right flex flex-col justify-center min-w-[60px]">
                                            <span className="font-bold text-sm text-primary tabular-nums tracking-tight">
                                                ${lineTotalUsd.toFixed(2)}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/70 font-medium tabular-nums">
                                                Bs {lineTotalBs.toFixed(2)}
                                            </span>
                                        </div>

                                        {/* 5. Acción Eliminar (Grid Column Dedicated) */}
                                        <div className="flex justify-end">
                                            {!isMobile && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onRemoveItem(item.id)
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white hover:scale-110 shadow-sm"
                                                    title="Eliminar producto"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </SwipeableItem>
                            )
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
