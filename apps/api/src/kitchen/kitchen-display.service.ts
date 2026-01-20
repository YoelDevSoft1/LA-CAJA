import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { Table } from '../database/entities/table.entity';
import { Product } from '../database/entities/product.entity';

export interface KitchenOrderItem {
  id: string;
  product_name: string;
  qty: number;
  note: string | null;
  status: 'pending' | 'preparing' | 'ready';
  added_at: string;
}

export interface KitchenOrder {
  id: string;
  order_number: string;
  table_number: string;
  table_name: string | null;
  items: KitchenOrderItem[];
  created_at: string;
  elapsed_time: number; // minutos desde que se creó
}

/**
 * Servicio para Kitchen Display System (KDS)
 */
@Injectable()
export class KitchenDisplayService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  /**
   * Obtiene todas las órdenes abiertas para la cocina
   */
  async getKitchenOrders(storeId: string): Promise<KitchenOrder[]> {
    const orders = await this.orderRepository.find({
      where: {
        store_id: storeId,
        status: 'open',
      },
      relations: ['table', 'items', 'items.product'],
      order: {
        opened_at: 'ASC',
      },
    });

    return orders.map((order) => {
      const elapsedMinutes = Math.floor(
        (Date.now() - new Date(order.opened_at).getTime()) / 60000
      );

      return {
        id: order.id,
        order_number: order.order_number,
        table_number: order.table?.table_number || 'Sin mesa',
        table_name: order.table?.name || null,
        items: order.items.map((item) => ({
          id: item.id,
          product_name: (item.product as any)?.name || 'Producto desconocido',
          qty: item.qty,
          note: item.note,
          status: 'pending' as const, // Por ahora todos pendientes, se puede extender
          added_at: item.added_at.toISOString(),
        })),
        created_at: order.opened_at.toISOString(),
        elapsed_time: elapsedMinutes,
      };
    });
  }

  /**
   * Obtiene una orden específica para la cocina
   */
  async getKitchenOrder(storeId: string, orderId: string): Promise<KitchenOrder | null> {
    const order = await this.orderRepository.findOne({
      where: {
        id: orderId,
        store_id: storeId,
        status: 'open',
      },
      relations: ['table', 'items', 'items.product'],
    });

    if (!order) return null;

    const elapsedMinutes = Math.floor(
      (Date.now() - new Date(order.opened_at).getTime()) / 60000
    );

    return {
      id: order.id,
      order_number: order.order_number,
      table_number: order.table?.table_number || 'Sin mesa',
      table_name: order.table?.name || null,
      items: order.items.map((item) => ({
        id: item.id,
        product_name: (item.product as any)?.name || 'Producto desconocido',
        qty: item.qty,
        note: item.note,
        status: 'pending' as const,
        added_at: item.added_at.toISOString(),
      })),
      created_at: order.opened_at.toISOString(),
      elapsed_time: elapsedMinutes,
    };
  }
}
