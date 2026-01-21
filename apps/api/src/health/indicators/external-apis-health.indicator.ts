import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class ExternalApisHealthIndicator extends HealthIndicator {
  private axiosInstance: AxiosInstance;

  constructor(private configService: ConfigService) {
    super();
    this.axiosInstance = axios.create({
      timeout: 5000,
    });
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const checks: Record<string, any> = {};
    let allHealthy = true;

    // Verificar API de tasas de cambio (BCV)
    try {
      const startTime = Date.now();
      const response = await this.axiosInstance.get('https://bcv.gov.ve/', {
        timeout: 5000,
        validateStatus: () => true, // Aceptar cualquier status para verificar conectividad
      });
      const responseTime = Date.now() - startTime;
      checks.bcv = {
        status: response.status < 500 ? 'reachable' : 'unreachable',
        responseTime: `${responseTime}ms`,
      };
      if (response.status >= 500) allHealthy = false;
    } catch (error) {
      checks.bcv = {
        status: 'unreachable',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      allHealthy = false;
    }

    // Verificar servicio de email (Resend)
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    if (resendApiKey) {
      try {
        const startTime = Date.now();
        const response = await this.axiosInstance.get('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${resendApiKey}` },
          timeout: 5000,
          validateStatus: () => true,
        });
        const responseTime = Date.now() - startTime;
        checks.resend = {
          status: response.status === 200 ? 'connected' : 'error',
          responseTime: `${responseTime}ms`,
        };
        if (response.status !== 200) allHealthy = false;
      } catch (error) {
        checks.resend = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        allHealthy = false;
      }
    } else {
      checks.resend = {
        status: 'not_configured',
      };
    }

    // Verificar WhatsApp (si está configurado)
    const whatsappEnabled = this.configService.get<string>('WHATSAPP_ENABLED') === 'true';
    if (whatsappEnabled) {
      checks.whatsapp = {
        status: 'configured',
        // Nota: Verificación real requeriría acceso al servicio de WhatsApp
      };
    } else {
      checks.whatsapp = {
        status: 'not_configured',
      };
    }

    if (!allHealthy) {
      throw new HealthCheckError(
        'Some external APIs are unhealthy',
        this.getStatus(key, false, checks),
      );
    }

    return this.getStatus(key, true, checks);
  }
}
