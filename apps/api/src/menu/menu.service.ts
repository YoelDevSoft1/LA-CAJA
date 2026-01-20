import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../database/entities/product.entity';
import { QRCode } from '../database/entities/qr-code.entity';
import { Table } from '../database/entities/table.entity';
import { InventoryMovement } from '../database/entities/inventory-movement.entity';

/**
 * Servicio para menú público
 * Proporciona menú sincronizado con inventario en tiempo real
 */
@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(QRCode)
    private qrCodeRepository: Repository<QRCode>,
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(InventoryMovement)
    private inventoryMovementRepository: Repository<InventoryMovement>,
  ) {}

  /**
   * Valida el código QR y obtiene información de la mesa
   */
  async validateQRCode(qrCodeString: string): Promise<{
    table: Table;
    qrCode: QRCode;
  }> {
    const qrCode = await this.qrCodeRepository.findOne({
      where: { qr_code: qrCodeString },
      relations: ['table', 'store'],
    });

    if (!qrCode) {
      throw new NotFoundException('Código QR no encontrado');
    }

    if (!qrCode.is_active) {
      throw new BadRequestException('Código QR inactivo');
    }

    if (qrCode.expires_at && qrCode.expires_at < new Date()) {
      throw new BadRequestException('Código QR expirado');
    }

    const table = await this.tableRepository.findOne({
      where: { id: qrCode.table_id },
      relations: ['store'],
    });

    if (!table) {
      throw new NotFoundException('Mesa no encontrada');
    }

    return { table, qrCode };
  }

  /**
   * Obtiene el menú público filtrado por disponibilidad
   */
  async getPublicMenu(storeId: string): Promise<{
    categories: Array<{
      name: string;
      products: Array<{
        id: string;
        name: string;
        category: string | null;
        price_bs: number;
        price_usd: number;
        description: string | null;
        image_url: string | null;
        is_available: boolean;
        stock_available: number | null;
      }>;
    }>;
  }> {
    // Obtener todos los productos activos de la tienda
    const products = await this.productRepository.find({
      where: {
        store_id: storeId,
        is_active: true,
      },
      order: {
        category: 'ASC',
        name: 'ASC',
      },
    });

    // Calcular disponibilidad basada en stock actual
    // Por ahora, asumimos que si el producto tiene stock threshold configurado
    // y el stock es mayor a 0, está disponible
    // En el futuro se puede mejorar con consultas más precisas

    // Agrupar por categoría
    const categoriesMap = new Map<string, typeof products>();

    for (const product of products) {
      // Verificar disponibilidad básica
      // TODO: Mejorar esto con consulta real de stock
      const isAvailable = true; // Por ahora todos los activos están disponibles
      const stockAvailable = null; // Se puede mejorar calculando stock real

      const categoryName = product.category || 'Sin categoría';

      if (!categoriesMap.has(categoryName)) {
        categoriesMap.set(categoryName, []);
      }

      const categoryProducts = categoriesMap.get(categoryName)!;
      categoryProducts.push({
        ...product,
        is_available: isAvailable,
        stock_available: stockAvailable,
      } as any);
    }

    // Convertir a formato de respuesta
    const categories = Array.from(categoriesMap.entries()).map(
      ([name, products]) => ({
        name,
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price_bs: Number(p.price_bs),
          price_usd: Number(p.price_usd),
          description: null, // Se puede agregar campo description a Product
          image_url: null, // Se puede agregar campo image_url a Product
          is_available: (p as any).is_available,
          stock_available: (p as any).stock_available,
        })),
      }),
    );

    return { categories };
  }

  /**
   * Obtiene un producto específico del menú público
   */
  async getPublicProduct(storeId: string, productId: string): Promise<{
    id: string;
    name: string;
    category: string | null;
    price_bs: number;
    price_usd: number;
    description: string | null;
    image_url: string | null;
    is_available: boolean;
    stock_available: number | null;
  }> {
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
        store_id: storeId,
        is_active: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // TODO: Calcular disponibilidad real basada en stock
    const isAvailable = true;
    const stockAvailable = null;

    return {
      id: product.id,
      name: product.name,
      category: product.category,
      price_bs: Number(product.price_bs),
      price_usd: Number(product.price_usd),
      description: null,
      image_url: null,
      is_available: isAvailable,
      stock_available: stockAvailable,
    };
  }
}
