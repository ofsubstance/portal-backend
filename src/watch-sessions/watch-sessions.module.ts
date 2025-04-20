import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchSession } from '../entities/watch_sessions.entity';
import { WatchSessionsController } from './watch-sessions.controller';
import { WatchSessionsService } from './watch-sessions.service';

@Module({
  imports: [TypeOrmModule.forFeature([WatchSession])],
  providers: [WatchSessionsService],
  controllers: [WatchSessionsController],
  exports: [WatchSessionsService],
})
export class WatchSessionsModule {}
