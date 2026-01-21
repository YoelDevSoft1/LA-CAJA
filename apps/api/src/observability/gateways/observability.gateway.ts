import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WebSocketHealthIndicator } from '../../health/indicators/websocket-health.indicator';
import { AlertService } from '../services/alert.service';
import { UptimeTrackerService } from '../services/uptime-tracker.service';
import { ObservabilityService } from '../services/observability.service';

@WebSocketGateway({
  namespace: 'observability',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ObservabilityGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ObservabilityGateway.name);

  constructor(
    private websocketHealth: WebSocketHealthIndicator,
    private alertService: AlertService,
    private uptimeTracker: UptimeTrackerService,
    private observabilityService: ObservabilityService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.websocketHealth.registerConnection();

    // Enviar estado inicial
    this.sendInitialData(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.websocketHealth.unregisterConnection();
  }

  @SubscribeMessage('subscribe:status')
  handleSubscribeStatus(client: Socket) {
    this.logger.log(`Client ${client.id} subscribed to status updates`);
    client.join('status');
  }

  @SubscribeMessage('subscribe:alerts')
  handleSubscribeAlerts(client: Socket) {
    this.logger.log(`Client ${client.id} subscribed to alerts`);
    client.join('alerts');
  }

  @SubscribeMessage('subscribe:metrics')
  handleSubscribeMetrics(client: Socket) {
    this.logger.log(`Client ${client.id} subscribed to metrics`);
    client.join('metrics');
  }

  /**
   * Envía datos iniciales al cliente
   */
  private async sendInitialData(client: Socket) {
    try {
      const status = await this.observabilityService.getStatus();
      const activeAlerts = await this.alertService.getActiveAlerts();
      const uptime = await this.uptimeTracker.calculateUptime(undefined, 30);

      client.emit('initial:data', {
        status,
        alerts: activeAlerts,
        uptime,
      });
    } catch (error) {
      this.logger.error('Error sending initial data', error);
    }
  }

  /**
   * Emite actualización de estado
   */
  async emitStatusUpdate() {
    try {
      const status = await this.observabilityService.getStatus();
      this.server.to('status').emit('status:update', status);
    } catch (error) {
      this.logger.error('Error emitting status update', error);
    }
  }

  /**
   * Emite nueva alerta
   */
  async emitNewAlert(alert: any) {
    this.server.to('alerts').emit('alert:new', alert);
  }

  /**
   * Emite actualización de métricas
   */
  async emitMetricsUpdate(metrics: any) {
    this.server.to('metrics').emit('metrics:update', metrics);
  }
}
