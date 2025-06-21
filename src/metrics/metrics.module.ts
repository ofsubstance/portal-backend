import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginEvent } from 'src/entities/login_events.entity';
import { ShareableLink } from 'src/entities/sharable_links.entity';
import { ShareableLinkEngagement } from 'src/entities/shareable_link_engagements.entity';
import { Profile } from 'src/entities/user_profiles.entity';
import { UserSession } from 'src/entities/user_sessions.entity';
import { User } from 'src/entities/users.entity';
import { Video } from 'src/entities/videos.entity';
import { WatchSession } from 'src/entities/watch_sessions.entity';
import { ContentMetricsController } from './controllers/content-metrics.controller';
import { EngagementMetricsController } from './controllers/engagement.controller';
import { MacroContentMetricsController } from './controllers/macro-content.controller';
import { PerformanceMetricsController } from './controllers/performance.controller';
import { ContentMetricsService } from './services/content-metrics.service';
import { EngagementMetricsService } from './services/engagement-metrics.service';
import { MacroContentMetricsService } from './services/macro-content-metrics.service';
import { MetricsService } from './services/metrics.service';
import { PerformanceMetricsService } from './services/performance-metrics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Profile,
      LoginEvent,
      UserSession,
      WatchSession,
      Video,
      ShareableLink,
      ShareableLinkEngagement,
    ]),
  ],
  controllers: [
    PerformanceMetricsController,
    EngagementMetricsController,
    MacroContentMetricsController,
    ContentMetricsController,
  ],
  providers: [
    MetricsService,
    PerformanceMetricsService,
    EngagementMetricsService,
    MacroContentMetricsService,
    ContentMetricsService,
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
