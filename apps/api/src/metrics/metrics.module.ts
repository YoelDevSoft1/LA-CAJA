import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  // No incluir MetricsController - PrometheusModule ya proporciona el endpoint /metrics
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
