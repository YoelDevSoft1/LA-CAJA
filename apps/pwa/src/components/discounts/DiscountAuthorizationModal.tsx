import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Lock } from 'lucide-react'
import { AuthorizeDiscountRequest } from '@/services/discounts.service'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

const authorizeDiscountSchema = z.object({
  reason: z.string().max(500, 'La razón no puede exceder 500 caracteres').optional().nullable(),
  authorization_pin: z.string().optional(),
})

type AuthorizeDiscountFormData = z.infer<typeof authorizeDiscountSchema>

interface DiscountAuthorizationModalProps {
  isOpen: boolean
  onClose: () => void
  saleId: string
  discountAmountBs: number
  discountAmountUsd: number
  discountPercentage: number
  onConfirm: (data: AuthorizeDiscountRequest) => void
  isLoading: boolean
}

export default function DiscountAuthorizationModal({
  isOpen,
  onClose,
  saleId,
  discountAmountBs,
  discountAmountUsd,
  discountPercentage,
  onConfirm,
  isLoading,
}: DiscountAuthorizationModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthorizeDiscountFormData>({
    resolver: zodResolver(authorizeDiscountSchema),
    defaultValues: {
      reason: '',
      authorization_pin: '',
    },
  })

  const onSubmit = (data: AuthorizeDiscountFormData) => {
    const requestData: AuthorizeDiscountRequest = {
      sale_id: saleId,
      reason: data.reason || null,
      authorization_pin: data.authorization_pin || undefined,
    }
    onConfirm(requestData)
    reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] sm:max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-border flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl flex items-center">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-2" />
            Autorizar Descuento
          </DialogTitle>
          <DialogDescription className="sr-only">
            Autoriza el descuento aplicado en la venta
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-4 md:px-6 py-4 sm:py-6">
            <div className="space-y-4">
              <Alert className="bg-warning/10 border-warning/50">
                <AlertDescription className="text-sm text-foreground">
                  Estás autorizando un descuento. Esta acción quedará registrada en el historial.
                </AlertDescription>
              </Alert>

              {/* Información del descuento */}
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg border border-border">
                <h3 className="text-sm font-semibold text-foreground">Detalles del Descuento</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Porcentaje:</p>
                    <p className="font-semibold text-foreground">{discountPercentage.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Monto Bs:</p>
                    <p className="font-semibold text-foreground">
                      {Number(discountAmountBs).toFixed(2)} Bs
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Monto USD:</p>
                    <p className="font-semibold text-foreground">
                      ${Number(discountAmountUsd).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* PIN de autorización */}
              <div>
                <Label htmlFor="authorization_pin">PIN de Autorización (Opcional)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="authorization_pin"
                    type="password"
                    {...register('authorization_pin')}
                    className="pl-10"
                    placeholder="Ingresa tu PIN si es requerido"
                    disabled={isLoading}
                  />
                </div>
                {errors.authorization_pin && (
                  <p className="mt-1 text-sm text-destructive">{errors.authorization_pin.message}</p>
                )}
              </div>

              {/* Razón del descuento */}
              <div>
                <Label htmlFor="reason">Razón del Descuento (Opcional)</Label>
                <Textarea
                  id="reason"
                  {...register('reason')}
                  rows={4}
                  className="mt-2 resize-none"
                  placeholder="Explica la razón del descuento..."
                  maxLength={500}
                  disabled={isLoading}
                />
                {errors.reason && (
                  <p className="mt-1 text-sm text-destructive">{errors.reason.message}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Máximo 500 caracteres. Esta información quedará registrada en el historial.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-border px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Autorizando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Autorizar Descuento
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

