import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WhatsAppConfigService } from './whatsapp-config.service';
import { WhatsAppBotService } from './whatsapp-bot.service';
import { CreateWhatsAppConfigDto } from './dto/create-whatsapp-config.dto';
import { UpdateWhatsAppConfigDto } from './dto/update-whatsapp-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsAppController {
  constructor(
    private readonly whatsappConfigService: WhatsAppConfigService,
    private readonly whatsappBotService: WhatsAppBotService,
  ) {}

  @Get('config')
  async getConfig(@Request() req: any) {
    const storeId = req.user.store_id;
    return this.whatsappConfigService.findOne(storeId);
  }

  @Post('config')
  @Roles('owner')
  async createConfig(
    @Body() dto: CreateWhatsAppConfigDto,
    @Request() req: any,
  ) {
    const storeId = req.user.store_id;
    return this.whatsappConfigService.upsert(storeId, dto);
  }

  @Patch('config')
  @Roles('owner')
  async updateConfig(
    @Body() dto: UpdateWhatsAppConfigDto,
    @Request() req: any,
  ) {
    const storeId = req.user.store_id;
    return this.whatsappConfigService.update(storeId, dto);
  }

  @Get('qr')
  @Roles('owner')
  async getQRCode(@Request() req: any) {
    const storeId = req.user.store_id;

    // Inicializar bot si no está inicializado
    await this.whatsappBotService.initializeBot(storeId);

    // Obtener QR code
    const qrCode = await this.whatsappBotService.getQRCode(storeId);

    return {
      qrCode,
      isConnected: this.whatsappBotService.isConnected(storeId),
    };
  }

  @Get('status')
  async getStatus(@Request() req: any) {
    const storeId = req.user.store_id;

    const isConnected = this.whatsappBotService.isConnected(storeId);
    const whatsappNumber = this.whatsappBotService.getWhatsAppNumber(storeId);
    const connectionState = this.whatsappBotService.getConnectionState(storeId);

    return {
      isConnected,
      whatsappNumber,
      connectionState: connectionState || null,
    };
  }

  @Post('disconnect')
  @Roles('owner')
  async disconnect(@Request() req: any) {
    const storeId = req.user.store_id;
    await this.whatsappBotService.disconnect(storeId);
    return { success: true, message: 'Bot desconectado exitosamente' };
  }
}
