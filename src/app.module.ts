import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from 'config.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { DataExportModule } from './data-export/data-export.module';
import { EmailService } from './email.service';
import { EntitiesModule } from './entities/entities.module';
import { ExceptionFilterModule } from './exception-filters/exception-filter.module';
import { FeedbackModule } from './feedback/feedback.module';
import { GoHighLevelModule } from './gohighlevel/gohighlevel.module';

import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { MetricsModule } from './metrics/metrics.module';
import { SharelinksModule } from './sharelinks/sharelinks.module';
import { UserSessionsModule } from './user-sessions/user-sessions.module';
import { UsersModule } from './users/users.module';
import { VideoModule } from './video/video.module';
import { WatchSessionsModule } from './watch-sessions/watch-sessions.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      autoLoadEntities: true,
      synchronize: true,
      ssl: {
        rejectUnauthorized: false, // for dev
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      secret: process.env.ACCESS_TOKEN_SECRET,
      signOptions: { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION },
    }),
    AuthModule,
    UsersModule,
    AppConfigModule,
    ExceptionFilterModule,
    AnalyticsModule,
    VideoModule,
    EntitiesModule,
    SharelinksModule,
    CommentsModule,
    MetricsModule,
    GoHighLevelModule,
    UserSessionsModule,
    FeedbackModule,
    WatchSessionsModule,
    DataExportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EmailService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
