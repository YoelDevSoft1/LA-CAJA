import { ShoppingBag, Tag, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface InvoiceSeries {
    id: string
    name: string
    prefix?: string | null
}

interface PriceList {
    id: string
    name: string
}

interface Promotion {
    id: string
    name: string
    code?: string | null
}

interface Warehouse {
    id: string
    name: string
}

interface InvoiceConfigSectionProps {
    invoiceSeries: InvoiceSeries[]
    priceLists: PriceList[]
    promotions: Promotion[]
    warehouses: Warehouse[]
    selectedSeriesId: string | null
    selectedPriceListId: string | null
    selectedPromotionId: string | null
    selectedWarehouseId: string | null
    onSeriesChange: (id: string | null) => void
    onPriceListChange: (id: string | null) => void
    onPromotionChange: (id: string | null) => void
    onWarehouseChange: (id: string | null) => void
    className?: string
}

export default function InvoiceConfigSection({
    invoiceSeries,
    priceLists,
    promotions,
    warehouses,
    selectedSeriesId,
    selectedPriceListId,
    selectedPromotionId,
    selectedWarehouseId,
    onSeriesChange,
    onPriceListChange,
    onPromotionChange,
    onWarehouseChange,
    className,
}: InvoiceConfigSectionProps) {
    return (
        <Card className={className}>
            <CardContent className="p-4 space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Configuración de Venta
                </h3>

                {/* Serie de Factura */}
                {invoiceSeries.length > 0 && (
                    <div className="space-y-2">
                        <Label htmlFor="invoice-series">Serie de Factura</Label>
                        <Select
                            value={selectedSeriesId || 'none'}
                            onValueChange={(value) => onSeriesChange(value === 'none' ? null : value)}
                        >
                            <SelectTrigger id="invoice-series">
                                <SelectValue placeholder="Seleccionar serie..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sin serie específica</SelectItem>
                                {invoiceSeries.map((series) => (
                                    <SelectItem key={series.id} value={series.id}>
                                        {series.prefix ? `${series.prefix} - ` : ''}{series.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Lista de Precios */}
                {priceLists.length > 0 && (
                    <div className="space-y-2">
                        <Label htmlFor="price-list" className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            Lista de Precios
                        </Label>
                        <Select
                            value={selectedPriceListId || 'none'}
                            onValueChange={(value) => onPriceListChange(value === 'none' ? null : value)}
                        >
                            <SelectTrigger id="price-list">
                                <SelectValue placeholder="Seleccionar lista..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Lista por defecto</SelectItem>
                                {priceLists.map((list) => (
                                    <SelectItem key={list.id} value={list.id}>
                                        {list.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Promoción */}
                {promotions.length > 0 && (
                    <div className="space-y-2">
                        <Label htmlFor="promotion" className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            Promoción
                        </Label>
                        <Select
                            value={selectedPromotionId || 'none'}
                            onValueChange={(value) => onPromotionChange(value === 'none' ? null : value)}
                        >
                            <SelectTrigger id="promotion">
                                <SelectValue placeholder="Seleccionar promoción..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sin promoción</SelectItem>
                                {promotions.map((promo) => (
                                    <SelectItem key={promo.id} value={promo.id}>
                                        {promo.name} {promo.code ? `(${promo.code})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Bodega */}
                {warehouses.length > 0 && (
                    <div className="space-y-2">
                        <Label htmlFor="warehouse" className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            Bodega
                        </Label>
                        <Select
                            value={selectedWarehouseId || 'none'}
                            onValueChange={(value) => onWarehouseChange(value === 'none' ? null : value)}
                        >
                            <SelectTrigger id="warehouse">
                                <SelectValue placeholder="Seleccionar bodega..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Bodega por defecto</SelectItem>
                                {warehouses.map((warehouse) => (
                                    <SelectItem key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
