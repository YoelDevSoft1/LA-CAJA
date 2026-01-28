import { memo, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { calculateChangeInBs, formatCurrency } from '@/utils/checkout-utils'

interface CashPaymentSectionProps {
    mode: 'USD' | 'BS'
    totalAmount: number
    exchangeRate: number
    receivedAmount: number
    onAmountChange: (amount: number) => void
    giveChangeInBs?: boolean
    onGiveChangeInBsChange?: (value: boolean) => void
    className?: string
}

const CashPaymentSection = memo(function CashPaymentSection({
    mode,
    totalAmount,
    exchangeRate,
    receivedAmount,
    onAmountChange,
    giveChangeInBs = false,
    onGiveChangeInBsChange,
    className,
}: CashPaymentSectionProps) {
    // Auto-fill con el total
    useEffect(() => {
        if (receivedAmount === 0) {
            onAmountChange(totalAmount)
        }
    }, [totalAmount, receivedAmount, onAmountChange])

    const { change, changeBs } = useMemo(() => {
        const changeAmount = Math.max(0, receivedAmount - totalAmount)
        const changeBsAmount = mode === 'USD' && giveChangeInBs
            ? calculateChangeInBs(receivedAmount, totalAmount, exchangeRate)
            : changeAmount

        return { change: changeAmount, changeBs: changeBsAmount }
    }, [receivedAmount, totalAmount, mode, giveChangeInBs, exchangeRate])

    const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onAmountChange(parseFloat(e.target.value) || 0)
    }, [onAmountChange])

    const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onGiveChangeInBsChange?.(e.target.checked)
    }, [onGiveChangeInBsChange])

    return (
        <Card className={className}>
            <CardContent className="p-4 space-y-4">
                <div>
                    <Label htmlFor="received-amount">
                        Monto Recibido ({mode === 'USD' ? 'USD' : 'Bs'})
                    </Label>
                    <Input
                        id="received-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={receivedAmount || ''}
                        onChange={handleAmountChange}
                        placeholder={`0.00 ${mode === 'USD' ? 'USD' : 'Bs'}`}
                        className="text-lg mt-1"
                    />
                </div>

                {mode === 'USD' && onGiveChangeInBsChange && (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="give-change-bs"
                            checked={giveChangeInBs}
                            onChange={handleCheckboxChange}
                            className="rounded"
                        />
                        <Label htmlFor="give-change-bs" className="cursor-pointer">
                            Dar cambio en Bs
                        </Label>
                    </div>
                )}

                {change > 0 && (
                    <div className="bg-muted p-3 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Cambio:</span>
                            <span className="text-lg font-bold">
                                {formatCurrency(change, mode)}
                            </span>
                        </div>

                        {mode === 'USD' && giveChangeInBs && (
                            <div className="text-sm text-muted-foreground">
                                ≈ {formatCurrency(changeBs, 'BS')}
                            </div>
                        )}
                    </div>
                )}

                {receivedAmount < totalAmount && receivedAmount > 0 && (
                    <div className="text-sm text-destructive">
                        ⚠️ Monto insuficiente. Faltan {formatCurrency(totalAmount - receivedAmount, mode)}
                    </div>
                )}
            </CardContent>
        </Card>
    )
})

export default CashPaymentSection
