import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class WebSocketHealthIndicator extends HealthIndicator {
  private activeConnections = 0;
  private totalConnections = 0;

  /**
   * Registra una nueva conexión WebSocket
   */
  registerConnection() {
    this.activeConnections++;
    this.totalConnections++;
  }

  /**
   * Registra una desconexión WebSocket
   */
  unregisterConnection() {
    if (this.activeConnections > 0) {
      this.activeConnections--;
    }
  }

  /**
   * Obtiene el número de conexiones activas
   */
  getActiveConnections(): number {
    return this.activeConnections;
  }

  /**
   * Obtiene el total de conexiones desde el inicio
   */
  getTotalConnections(): number {
    return this.totalConnections;
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    return this.getStatus(key, true, {
      status: 'operational',
      activeConnections: this.activeConnections,
      totalConnections: this.totalConnections,
    });
  }
}
