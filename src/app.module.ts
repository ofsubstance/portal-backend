import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from 'config.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ExceptionFiltersModule } from './exception-filters/exception-filters.module';
import { FinanceModule } from './finance/finance.module';
import { UsersModule } from './users/users.module';
import { VideoModule } from './video/video.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      autoLoadEntities: true, // Load entity classes automatically from the "entities" array.
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    AppConfigModule,
    ExceptionFiltersModule,
    AnalyticsModule,
    FinanceModule,
    ExceptionFiltersModule,
    VideoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
