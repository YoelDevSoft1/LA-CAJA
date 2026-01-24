import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Loader2 } from 'lucide-react'
import { Customer } from '@/services/customers.service'
import { Debt, debtsService, calculateDebtTotals } from '@/services/debts.service'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import toast from '@/lib/toast'

export interface SelectDebtsForWhatsAppModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer
  openDebts: Debt[]
  onSuccess?: () => void
}

export default function SelectDebtsForWhatsAppModal({
  isOpen,
  onClose,
  customer,
  openDebts,
  onSuccess,
}: SelectDebtsForWhatsAppModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(openDebts.map((d) => d.id)))
  const [isSending, setIsSending] = useState(false)
  const prevOpen = useRef(false)
  const openDebtsRef = useRef(openDebts)
  openDebtsRef.current = openDebts

  // Al abrir el modal, marcar todas las deudas como seleccionadas
  useEffect(() => {
    if (isOpen && !prevOpen.current) {
      setSelectedIds(new Set(openDebtsRef.current.map((d) => d.id)))
    }
    prevOpen.current = isOpen
  }, [isOpen])

  const selectAll = () => setSelectedIds(new Set(openDebts.map((d) => d.id)))
  const selectNone = () => setSelectedIds(new Set())
  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedList = Array.from(selectedIds)
  const totalSelectedUsd = openDebts
    .filter((d) => selectedIds.has(d.id))
    .reduce((sum, d) => sum + calculateDebtTotals(d).remaining_usd, 0)

  const handleSend = async () => {
    if (selectedList.length === 0) {
      toast.error('Seleccione al menos una deuda')
      return
    }
    setIsSending(true)
    try {
      const result = await debtsService.sendDebtReminder(customer.id, selectedList)
      if (result.success) {
        toast.success('Recordatorio de deudas enviado por WhatsApp')
        onSuccess?.()
        onClose()
      } else {
        toast.error(result.error || 'Error al enviar recordatorio')
      }
    } catch (error: any) {
      console.error('[SelectDebtsForWhatsAppModal] Error:', error)
      toast.error(error.response?.data?.message || 'Error al enviar recordatorio por WhatsApp')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Enviar estado de fiados por WhatsApp
          </DialogTitle>
          <DialogDescription>
            Elige las deudas pendientes de <strong>{customer.name}</strong> que quieres incluir en el mensaje.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between text-sm text-muted-foreground pb-2 border-b border-border">
          <button
            type="button"
            onClick={selectAll}
            className="hover:text-foreground hover:underline"
          >
            Seleccionar todas
          </button>
          <button
            type="button"
            onClick={selectNone}
            className="hover:text-foreground hover:underline"
          >
            Deseleccionar todas
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto py-2 space-y-2">
          {openDebts.map((debt) => {
            const calc = calculateDebtTotals(debt)
            const checked = selectedIds.has(debt.id)
            return (
              <label
                key={debt.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  checked ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(debt.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(debt.created_at), "dd MMM yyyy", { locale: es })}
                  </p>
                  <p className="font-medium text-foreground">
                    Monto: ${Number(debt.amount_usd).toFixed(2)} · Pendiente: ${calc.remaining_usd.toFixed(2)}
                  </p>
                </div>
              </label>
            )
          })}
        </div>

        {selectedList.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Total pendiente seleccionado: <span className="font-semibold text-warning">${totalSelectedUsd.toFixed(2)}</span>
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSending}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={selectedList.length === 0 || isSending}
            className="text-green-700 bg-green-50 hover:bg-green-100 border border-green-200"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar por WhatsApp
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
