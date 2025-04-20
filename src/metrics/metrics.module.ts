import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginEvent } from 'src/entities/login_events.entity';
import { Profile } from 'src/entities/user_profiles.entity';
import { UserSession } from 'src/entities/user_sessions.entity';
import { User } from 'src/entities/users.entity';
import { DistributionMetricsController } from './controllers/distribution.controller';
import { EngagementMetricsController } from './controllers/engagement.controller';
import { PerformanceMetricsController } from './controllers/performance.controller';
import { SessionMetricsController } from './controllers/session.controller';
import { DistributionMetricsService } from './services/distribution-metrics.service';
import { EngagementMetricsService } from './services/engagement-metrics.service';
import { MetricsService } from './services/metrics.service';
import { PerformanceMetricsService } from './services/performance-metrics.service';
import { SessionMetricsService } from './services/session-metrics.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Profile, LoginEvent, UserSession])],
  controllers: [
    PerformanceMetricsController,
    DistributionMetricsController,
    EngagementMetricsController,
    SessionMetricsController,
  ],
  providers: [
    MetricsService,
    SessionMetricsService,
    PerformanceMetricsService,
    DistributionMetricsService,
    EngagementMetricsService,
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
