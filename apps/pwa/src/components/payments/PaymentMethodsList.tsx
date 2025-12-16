import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Settings, Trash2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import {
  paymentsService,
  PaymentMethod,
  PaymentMethodConfig,
} from '@/services/payments.service'
import toast from 'react-hot-toast'
import PaymentMethodConfigModal from './PaymentMethodConfigModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH_BS: 'Efectivo Bs',
  CASH_USD: 'Efectivo USD',
  PAGO_MOVIL: 'Pago Móvil',
  TRANSFER: 'Transferencia',
  OTHER: 'Otro',
}

const allMethods: PaymentMethod[] = ['CASH_BS', 'CASH_USD', 'PAGO_MOVIL', 'TRANSFER', 'OTHER']

export default function PaymentMethodsList() {
  const queryClient = useQueryClient()
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null)

  const { data: configs, isLoading } = useQuery({
    queryKey: ['payments', 'methods'],
    queryFn: () => paymentsService.getPaymentMethodConfigs(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })

  const upsertMutation = useMutation({
    mutationFn: ({ method, data }: { method: PaymentMethod; data: any }) =>
      paymentsService.upsertPaymentMethodConfig(method, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      toast.success('Configuración guardada correctamente')
      setIsModalOpen(false)
      setSelectedMethod(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar la configuración')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (method: PaymentMethod) => paymentsService.deletePaymentMethodConfig(method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      toast.success('Configuración eliminada correctamente')
      setMethodToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar la configuración')
    },
  })

  const handleEdit = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setIsModalOpen(true)
  }


  const getConfigForMethod = (method: PaymentMethod): PaymentMethodConfig | null => {
    return configs?.find((c) => c.method === method) || null
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Configuración de Métodos de Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Método</TableHead>
                  <TableHead className="hidden sm:table-cell">Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Tope Mínimo</TableHead>
                  <TableHead className="hidden lg:table-cell">Tope Máximo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allMethods.map((method) => {
                  const config = getConfigForMethod(method)
                  const isConfigured = !!config
                  const isEnabled = config?.enabled ?? true

                  return (
                    <TableRow key={method}>
                      <TableCell>
                        <div className="flex items-center">
                          <CreditCard className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">{paymentMethodLabels[method]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {isConfigured ? (
                          <Badge variant={isEnabled ? 'default' : 'secondary'}>
                            {isEnabled ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Habilitado
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Deshabilitado
                              </>
                            )}
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Sin configurar
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {config ? (
                          <div className="text-sm">
                            {config.min_amount_bs !== null && (
                              <p>{Number(config.min_amount_bs).toFixed(2)} Bs</p>
                            )}
                            {config.min_amount_usd !== null && (
                              <p className="text-muted-foreground">
                                ${Number(config.min_amount_usd).toFixed(2)} USD
                              </p>
                            )}
                            {config.min_amount_bs === null && config.min_amount_usd === null && (
                              <p className="text-muted-foreground">Sin límite</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">-</p>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {config ? (
                          <div className="text-sm">
                            {config.max_amount_bs !== null && (
                              <p>{Number(config.max_amount_bs).toFixed(2)} Bs</p>
                            )}
                            {config.max_amount_usd !== null && (
                              <p className="text-muted-foreground">
                                ${Number(config.max_amount_usd).toFixed(2)} USD
                              </p>
                            )}
                            {config.max_amount_bs === null && config.max_amount_usd === null && (
                              <p className="text-muted-foreground">Sin límite</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">-</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(method)}
                            className="text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Settings className="w-4 h-4 mr-1.5" />
                            {isConfigured ? 'Editar' : 'Configurar'}
                          </Button>
                          {isConfigured && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMethodToDelete(method)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedMethod && (
        <PaymentMethodConfigModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedMethod(null)
          }}
          method={selectedMethod}
          config={getConfigForMethod(selectedMethod)}
          onConfirm={(data) =>
            upsertMutation.mutate({
              method: selectedMethod,
              data,
            })
          }
          isLoading={upsertMutation.isPending}
        />
      )}

      <AlertDialog open={!!methodToDelete} onOpenChange={() => setMethodToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar configuración?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la configuración de {methodToDelete && paymentMethodLabels[methodToDelete]}.
              ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => methodToDelete && deleteMutation.mutate(methodToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

