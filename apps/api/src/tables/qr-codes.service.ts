import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QRCode } from '../database/entities/qr-code.entity';
import { Table } from '../database/entities/table.entity';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';

/**
 * Servicio para gestión de códigos QR de mesas
 */
@Injectable()
export class QRCodesService {
  constructor(
    @InjectRepository(QRCode)
    private qrCodeRepository: Repository<QRCode>,
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
  ) {}

  /**
   * Genera un código QR único para una mesa
   */
  private generateQRCode(tableId: string, storeId: string): string {
    // Generar código único basado en store_id + table_id + timestamp
    const timestamp = Date.now();
    const data = `${storeId}-${tableId}-${timestamp}`;
    const hash = createHash('sha256').update(data).digest('hex');
    // Tomar primeros 32 caracteres y convertir a formato más legible
    return hash.substring(0, 32).toUpperCase();
  }

  /**
   * Genera la URL pública para acceder al menú de la mesa
   */
  private generatePublicUrl(qrCode: string): string {
    // En producción esto debería usar la URL base del frontend
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${baseUrl}/public/qr/${qrCode}`;
  }

  /**
   * Crea o actualiza el código QR de una mesa
   */
  async createOrUpdateQRCode(
    storeId: string,
    tableId: string,
  ): Promise<QRCode> {
    // Verificar que la mesa exista
    const table = await this.tableRepository.findOne({
      where: { id: tableId, store_id: storeId },
    });

    if (!table) {
      throw new NotFoundException('Mesa no encontrada');
    }

    // Verificar si ya existe un QR code para esta mesa
    let qrCode = await this.qrCodeRepository.findOne({
      where: { table_id: tableId },
    });

    if (qrCode) {
      // Si existe pero está inactivo o expirado, reactivarlo
      if (!qrCode.is_active || (qrCode.expires_at && qrCode.expires_at < new Date())) {
        qrCode.is_active = true;
        qrCode.expires_at = null;
        qrCode.updated_at = new Date();
        qrCode = await this.qrCodeRepository.save(qrCode);

        // Actualizar referencia en la mesa
        table.qr_code_id = qrCode.id;
        await this.tableRepository.save(table);

        return qrCode;
      }
      return qrCode;
    }

    // Generar nuevo código QR
    const qrCodeString = this.generateQRCode(tableId, storeId);
    const publicUrl = this.generatePublicUrl(qrCodeString);

    qrCode = this.qrCodeRepository.create({
      id: randomUUID(),
      store_id: storeId,
      table_id: tableId,
      qr_code: qrCodeString,
      public_url: publicUrl,
      is_active: true,
      expires_at: null, // Por defecto no expira
    });

    qrCode = await this.qrCodeRepository.save(qrCode);

    // Actualizar referencia en la mesa
    table.qr_code_id = qrCode.id;
    await this.tableRepository.save(table);

    return qrCode;
  }

  /**
   * Obtiene el código QR de una mesa
   */
  async getQRCodeByTable(
    storeId: string,
    tableId: string,
  ): Promise<QRCode> {
    const qrCode = await this.qrCodeRepository.findOne({
      where: { table_id: tableId, store_id: storeId },
    });

    if (!qrCode) {
      throw new NotFoundException('Código QR no encontrado para esta mesa');
    }

    return qrCode;
  }

  /**
   * Obtiene un código QR por su código único (para acceso público)
   */
  async getQRCodeByCode(qrCodeString: string): Promise<QRCode> {
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

    return qrCode;
  }

  /**
   * Desactiva un código QR
   */
  async deactivateQRCode(storeId: string, tableId: string): Promise<void> {
    const qrCode = await this.getQRCodeByTable(storeId, tableId);
    qrCode.is_active = false;
    qrCode.updated_at = new Date();
    await this.qrCodeRepository.save(qrCode);
  }

  /**
   * Regenera el código QR de una mesa (crea uno nuevo)
   */
  async regenerateQRCode(
    storeId: string,
    tableId: string,
  ): Promise<QRCode> {
    // Desactivar el anterior
    const existingQR = await this.qrCodeRepository.findOne({
      where: { table_id: tableId },
    });

    if (existingQR) {
      existingQR.is_active = false;
      await this.qrCodeRepository.save(existingQR);
    }

    // Crear nuevo
    return this.createOrUpdateQRCode(storeId, tableId);
  }
}
