import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { customersService, Customer } from '@/services/customers.service'
import { debtsService } from '@/services/debts.service'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
  Printer, 
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface CustomerStatementModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer | null
}

export default function CustomerStatementModal({
  isOpen,
  onClose,
  customer,
}: CustomerStatementModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  // Obtener historial de compras
  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['customer-history', customer?.id],
    queryFn: () => customersService.getPurchaseHistory(customer!.id, 50),
    enabled: isOpen && !!customer,
  })

  // Obtener resumen de deudas
  const { data: debtsSummary, isLoading: loadingDebts } = useQuery({
    queryKey: ['debts', 'customer-summary', customer?.id],
    queryFn: () => debtsService.getCustomerSummary(customer!.id),
    enabled: isOpen && !!customer,
  })

  // Obtener deudas individuales para mostrar en la tabla
  const { data: customerDebts } = useQuery({
    queryKey: ['debts', 'customer', customer?.id],
    queryFn: () => debtsService.getByCustomer(customer!.id, false),
    enabled: isOpen && !!customer,
  })

  const isLoading = loadingHistory || loadingDebts

  const handlePrint = () => {
    if (!printRef.current) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes para imprimir')
      return
    }

    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          padding: 20px;
          color: #1a1a1a;
          line-height: 1.5;
        }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
        .header h1 { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .header p { font-size: 14px; color: #666; }
        .customer-info { 
          background: #f5f5f5; 
          padding: 15px; 
          border-radius: 8px; 
          margin-bottom: 20px; 
        }
        .customer-info h2 { font-size: 18px; margin-bottom: 10px; color: #333; }
        .customer-info p { font-size: 14px; margin: 3px 0; }
        .stats-grid { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          gap: 10px; 
          margin-bottom: 20px; 
        }
        .stat-card { 
          background: #f5f5f5; 
          padding: 12px; 
          border-radius: 8px; 
          text-align: center; 
        }
        .stat-card .label { font-size: 11px; color: #666; margin-bottom: 4px; }
        .stat-card .value { font-size: 18px; font-weight: bold; color: #333; }
        .section-title { 
          font-size: 16px; 
          font-weight: bold; 
          margin: 20px 0 10px; 
          padding-bottom: 5px; 
          border-bottom: 1px solid #ddd; 
        }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
        th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f5f5f5; font-weight: 600; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .total-row { background: #f5f5f5; font-weight: bold; }
        .debt-status { 
          display: inline-block; 
          padding: 2px 8px; 
          border-radius: 4px; 
          font-size: 11px; 
          font-weight: 600; 
        }
        .debt-open { background: #fef2f2; color: #dc2626; }
        .debt-partial { background: #fff7ed; color: #ea580c; }
        .debt-paid { background: #f0fdf4; color: #16a34a; }
        .footer { 
          margin-top: 30px; 
          padding-top: 15px; 
          border-top: 1px solid #ddd; 
          text-align: center; 
          font-size: 12px; 
          color: #666; 
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    `

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Estado de Cuenta - ${customer?.name || 'Cliente'}</title>
          ${styles}
        </head>
        <body>
          ${printRef.current.innerHTML}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  if (!customer) return null

  const today = new Date()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 md:px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Estado de Cuenta</DialogTitle>
              <DialogDescription>
                {customer.name}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={isLoading}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Cargando estado de cuenta...</p>
            </div>
          )}

          {!isLoading && (
            <div ref={printRef}>
              {/* Header para impresión */}
              <div className="header">
                <h1>ESTADO DE CUENTA</h1>
                <p>Fecha de emisión: {format(today, "dd 'de' MMMM 'de' yyyy", { locale: es })}</p>
              </div>

              {/* Información del cliente */}
              <div className="customer-info">
                <h2>{customer.name}</h2>
                {customer.document_id && (
                  <p><strong>CI/RIF:</strong> {customer.document_id}</p>
                )}
                {customer.phone && (
                  <p><strong>Teléfono:</strong> {customer.phone}</p>
                )}
                {customer.email && (
                  <p><strong>Email:</strong> {customer.email}</p>
                )}
              </div>

              {/* Estadísticas */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="label">Total Compras</div>
                  <div className="value">{history?.total_purchases || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="label">Total en USD</div>
                  <div className="value">${(history?.total_amount_usd || 0).toFixed(2)}</div>
                </div>
                <div className="stat-card">
                  <div className="label">Saldo Deudor USD</div>
                  <div className="value" style={{ color: debtsSummary?.remaining_usd ? '#dc2626' : '#16a34a' }}>
                    ${(debtsSummary?.remaining_usd || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Deudas pendientes */}
              {customerDebts && customerDebts.length > 0 && (
                <>
                  <h3 className="section-title">Deudas Pendientes</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Factura</th>
                        <th className="text-right">Monto USD</th>
                        <th className="text-right">Pendiente USD</th>
                        <th className="text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerDebts
                        .filter((d) => d.status !== 'paid')
                        .map((debt) => {
                          const totalPaidUsd = (debt.payments || []).reduce((sum, p) => sum + Number(p.amount_usd), 0)
                          const remainingUsd = Number(debt.amount_usd) - totalPaidUsd
                          return (
                            <tr key={debt.id}>
                              <td>{format(new Date(debt.created_at), 'dd/MM/yyyy')}</td>
                              <td>{debt.sale?.id || '-'}</td>
                              <td className="text-right">${Number(debt.amount_usd).toFixed(2)}</td>
                              <td className="text-right">${remainingUsd.toFixed(2)}</td>
                              <td className="text-center">
                                <span className={`debt-status ${debt.status === 'open' ? 'debt-open' : 'debt-partial'}`}>
                                  {debt.status === 'open' ? 'Pendiente' : 'Parcial'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      <tr className="total-row">
                        <td colSpan={3}><strong>Total Pendiente</strong></td>
                        <td className="text-right"><strong>${(debtsSummary?.remaining_usd || 0).toFixed(2)}</strong></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}

              {/* Historial de compras */}
              {history && history.recent_sales && history.recent_sales.length > 0 && (
                <>
                  <h3 className="section-title">Historial de Compras Recientes</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Referencia</th>
                        <th>Método de Pago</th>
                        <th className="text-right">Total USD</th>
                        <th className="text-right">Total Bs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.recent_sales.map((sale) => (
                        <tr key={sale.id}>
                          <td>{format(new Date(sale.sold_at), 'dd/MM/yyyy HH:mm')}</td>
                          <td>{sale.sale_number || '-'}</td>
                          <td>{getPaymentMethodLabel(sale.payment_method)}</td>
                          <td className="text-right">${sale.total_usd.toFixed(2)}</td>
                          <td className="text-right">Bs {sale.total_bs.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* Resumen de crédito */}
              {customer.credit_limit && Number(customer.credit_limit) > 0 && (
                <>
                  <h3 className="section-title">Información de Crédito</h3>
                  <div className="customer-info">
                    <p><strong>Límite de Crédito:</strong> ${Number(customer.credit_limit).toFixed(2)} USD</p>
                    <p><strong>Crédito Utilizado:</strong> ${(debtsSummary?.remaining_usd || 0).toFixed(2)} USD</p>
                    <p><strong>Crédito Disponible:</strong> ${Math.max(0, Number(customer.credit_limit) - (debtsSummary?.remaining_usd || 0)).toFixed(2)} USD</p>
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="footer">
                <p>Este documento es un estado de cuenta informativo generado el {format(today, "dd/MM/yyyy 'a las' HH:mm", { locale: es })}</p>
                <p>Para cualquier consulta, contacte a su representante de ventas.</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getPaymentMethodLabel(method: string): string {
  const methods: Record<string, string> = {
    CASH_USD: 'Efectivo USD',
    CASH_BS: 'Efectivo Bs',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
    PAGO_MOVIL: 'Pago Móvil',
    ZELLE: 'Zelle',
    MIXED: 'Mixto',
    CREDIT: 'FIAO',
  }
  return methods[method] || method
}
