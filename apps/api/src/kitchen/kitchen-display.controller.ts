import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { KitchenDisplayService } from './kitchen-display.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Controlador para Kitchen Display System (KDS)
 */
@Controller('kitchen')
@UseGuards(JwtAuthGuard)
export class KitchenDisplayController {
  constructor(private readonly kitchenDisplayService: KitchenDisplayService) {}

  /**
   * GET /kitchen/orders
   * Obtiene todas las órdenes abiertas para la cocina
   */
  @Get('orders')
  async getKitchenOrders(@Request() req: any) {
    const storeId = req.user.store_id;
    return this.kitchenDisplayService.getKitchenOrders(storeId);
  }

  /**
   * GET /kitchen/orders/:id
   * Obtiene una orden específica para la cocina
   */
  @Get('orders/:id')
  async getKitchenOrder(@Param('id') id: string, @Request() req: any) {
    const storeId = req.user.store_id;
    const order = await this.kitchenDisplayService.getKitchenOrder(storeId, id);
    if (!order) {
      return { success: false, message: 'Orden no encontrada' };
    }
    return { success: true, order };
  }
}
