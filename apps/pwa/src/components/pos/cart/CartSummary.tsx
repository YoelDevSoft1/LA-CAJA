import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Tag } from 'lucide-react'

interface CartSummaryProps {
    totalUsd: number
    totalBs: number
    totalDiscountUsd: number
    hasOpenCash: boolean
    invalidCartProductIds: string[]
    itemsCount: number
    shouldPrint: boolean
    setShouldPrint: (val: boolean) => void
    onCheckout: () => void
}

export function CartSummary({
    totalUsd,
    totalBs,
    totalDiscountUsd,
    hasOpenCash,
    invalidCartProductIds,
    itemsCount,
    shouldPrint,
    setShouldPrint,
    onCheckout
}: CartSummaryProps) {
    // Nota: totalUsd ya viene con el descuento restado si se usa la lógica anterior, 
    // pero el componente original hacia: (total.usd + totalDiscountUsd) para mostrar subtotal.
    // Asumiremos que totalUsd es el TOTAL A PAGAR.

    const subtotalUsd = totalUsd + totalDiscountUsd

    return (
        <div className="flex-shrink-0 p-4 sm:p-5 border-t border-border/40 bg-gradient-to-r from-muted/20 via-background to-muted/20 space-y-4">
            {!hasOpenCash && (
                <div className="rounded-md border border-amber-500/70 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Debes abrir caja para procesar ventas.
                </div>
            )}
            {invalidCartProductIds.length > 0 && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    El carrito tiene productos inactivos o eliminados.
                </div>
            )}
            <div className="space-y-3">
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Imprimir ticket</Label>
                        <p className="text-xs text-muted-foreground">
                            Preguntar antes de gastar tinta/papel
                        </p>
                    </div>
                    <Switch checked={shouldPrint} onCheckedChange={setShouldPrint} />
                </div>

                {/* Preview de descuento aplicado - Premium */}
                {totalDiscountUsd > 0 ? (
                    <div className="space-y-3 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 shadow-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">Subtotal:</span>
                            <span className="text-base font-bold text-foreground tabular-nums">
                                ${subtotalUsd.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-primary/20 pt-2">
                            <div className="flex items-center gap-2">
                                <Tag className="w-3.5 h-3.5 text-primary" />
                                <span className="text-xs font-semibold text-primary">Descuento:</span>
                                <span className="text-[10px] text-muted-foreground">
                                    ({((totalDiscountUsd / subtotalUsd) * 100).toFixed(1)}%)
                                </span>
                            </div>
                            <span className="text-base font-bold text-primary tabular-nums">
                                -${totalDiscountUsd.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-primary/20 pt-2">
                            <span className="text-sm font-bold text-foreground">Total USD:</span>
                            <span className="text-2xl font-bold text-primary tabular-nums">
                                ${totalUsd.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-xs text-muted-foreground">Total Bs:</span>
                            <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                                Bs. {totalBs.toFixed(2)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20 shadow-lg">
                        <div className="flex justify-between items-baseline mb-2">
                            <span className="text-sm font-semibold text-muted-foreground">Total USD:</span>
                            <span className="text-3xl font-bold text-primary tabular-nums">
                                ${totalUsd.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-xs text-muted-foreground">Total Bs:</span>
                            <span className="text-base font-semibold text-muted-foreground tabular-nums">
                                Bs. {totalBs.toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
            <Button
                onClick={onCheckout}
                disabled={itemsCount === 0 || !hasOpenCash || invalidCartProductIds.length > 0}
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all"
                size="lg"
            >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Procesar Venta
            </Button>
        </div>
    )
}
