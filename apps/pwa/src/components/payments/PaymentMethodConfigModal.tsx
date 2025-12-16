import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CreditCard, DollarSign } from 'lucide-react'
import {
  PaymentMethod,
  PaymentMethodConfig,
  CreatePaymentMethodConfigRequest,
} from '@/services/payments.service'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'

const paymentMethodConfigSchema = z.object({
  min_amount_bs: z.number().min(0).nullable().optional(),
  min_amount_usd: z.number().min(0).nullable().optional(),
  max_amount_bs: z.number().min(0).nullable().optional(),
  max_amount_usd: z.number().min(0).nullable().optional(),
  enabled: z.boolean().optional(),
  requires_authorization: z.boolean().optional(),
})

type PaymentMethodConfigFormData = z.infer<typeof paymentMethodConfigSchema>

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH_BS: 'Efectivo Bs',
  CASH_USD: 'Efectivo USD',
  PAGO_MOVIL: 'Pago Móvil',
  TRANSFER: 'Transferencia',
  OTHER: 'Otro',
}

interface PaymentMethodConfigModalProps {
  isOpen: boolean
  onClose: () => void
  method: PaymentMethod
  config: PaymentMethodConfig | null
  onConfirm: (data: CreatePaymentMethodConfigRequest) => void
  isLoading: boolean
}

export default function PaymentMethodConfigModal({
  isOpen,
  onClose,
  method,
  config,
  onConfirm,
  isLoading,
}: PaymentMethodConfigModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<PaymentMethodConfigFormData>({
    resolver: zodResolver(paymentMethodConfigSchema),
    defaultValues: {
      min_amount_bs: null,
      min_amount_usd: null,
      max_amount_bs: null,
      max_amount_usd: null,
      enabled: true,
      requires_authorization: false,
    },
  })

  const enabled = watch('enabled')
  const requiresAuthorization = watch('requires_authorization')

  useEffect(() => {
    if (config) {
      reset({
        min_amount_bs: config.min_amount_bs ?? null,
        min_amount_usd: config.min_amount_usd ?? null,
        max_amount_bs: config.max_amount_bs ?? null,
        max_amount_usd: config.max_amount_usd ?? null,
        enabled: config.enabled,
        requires_authorization: config.requires_authorization,
      })
    } else {
      reset({
        min_amount_bs: null,
        min_amount_usd: null,
        max_amount_bs: null,
        max_amount_usd: null,
        enabled: true,
        requires_authorization: false,
      })
    }
  }, [config, reset])

  const onSubmit = (data: PaymentMethodConfigFormData) => {
    const requestData: CreatePaymentMethodConfigRequest = {
      method,
      min_amount_bs: data.min_amount_bs === null || data.min_amount_bs === undefined ? null : data.min_amount_bs,
      min_amount_usd: data.min_amount_usd === null || data.min_amount_usd === undefined ? null : data.min_amount_usd,
      max_amount_bs: data.max_amount_bs === null || data.max_amount_bs === undefined ? null : data.max_amount_bs,
      max_amount_usd: data.max_amount_usd === null || data.max_amount_usd === undefined ? null : data.max_amount_usd,
      enabled: data.enabled ?? true,
      requires_authorization: data.requires_authorization ?? false,
    }
    onConfirm(requestData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-border flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl flex items-center">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-2" />
            Configurar {paymentMethodLabels[method]}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Configura los topes y restricciones para el método de pago
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-4 md:px-6 py-4 sm:py-6">
            <div className="space-y-6">
              <Alert className="bg-info/5 border-info/50">
                <AlertDescription className="text-sm text-foreground">
                  Configura los topes mínimos y máximos para este método de pago. Deja los campos
                  vacíos para no establecer límites.
                </AlertDescription>
              </Alert>

              {/* Estado del método */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enabled" className="text-base">
                      Método Habilitado
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Permite o bloquea el uso de este método de pago
                    </p>
                  </div>
                  <Switch
                    id="enabled"
                    checked={enabled}
                    onCheckedChange={(checked) => setValue('enabled', checked)}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requires_authorization" className="text-base">
                      Requiere Autorización
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Si está activado, se requerirá autorización para usar este método
                    </p>
                  </div>
                  <Switch
                    id="requires_authorization"
                    checked={requiresAuthorization}
                    onCheckedChange={(checked) => setValue('requires_authorization', checked)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Topes en Bs */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Topes en Bolívares (Bs)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_amount_bs">Monto Mínimo (Bs)</Label>
                    <Input
                      id="min_amount_bs"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('min_amount_bs', {
                        valueAsNumber: true,
                        setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                      })}
                      className="mt-2"
                      placeholder="Sin límite"
                      disabled={isLoading}
                    />
                    {errors.min_amount_bs && (
                      <p className="mt-1 text-sm text-destructive">{errors.min_amount_bs.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="max_amount_bs">Monto Máximo (Bs)</Label>
                    <Input
                      id="max_amount_bs"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('max_amount_bs', {
                        valueAsNumber: true,
                        setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                      })}
                      className="mt-2"
                      placeholder="Sin límite"
                      disabled={isLoading}
                    />
                    {errors.max_amount_bs && (
                      <p className="mt-1 text-sm text-destructive">{errors.max_amount_bs.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Topes en USD */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Topes en Dólares (USD)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_amount_usd">Monto Mínimo (USD)</Label>
                    <Input
                      id="min_amount_usd"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('min_amount_usd', {
                        valueAsNumber: true,
                        setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                      })}
                      className="mt-2"
                      placeholder="Sin límite"
                      disabled={isLoading}
                    />
                    {errors.min_amount_usd && (
                      <p className="mt-1 text-sm text-destructive">{errors.min_amount_usd.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="max_amount_usd">Monto Máximo (USD)</Label>
                    <Input
                      id="max_amount_usd"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('max_amount_usd', {
                        valueAsNumber: true,
                        setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                      })}
                      className="mt-2"
                      placeholder="Sin límite"
                      disabled={isLoading}
                    />
                    {errors.max_amount_usd && (
                      <p className="mt-1 text-sm text-destructive">{errors.max_amount_usd.message}</p>
                    )}
                  </div>
                </div>
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
                    Guardando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Guardar Configuración
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

