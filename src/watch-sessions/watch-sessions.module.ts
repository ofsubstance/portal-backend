import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSessionsModule } from '../user-sessions/user-sessions.module';
import { User } from '../entities/users.entity';
import { Video } from '../entities/videos.entity';
import { WatchSession } from '../entities/watch_sessions.entity';
import { GoHighLevelModule } from '../gohighlevel/gohighlevel.module';
import { WatchSessionsController } from './watch-sessions.controller';
import { WatchSessionsService } from './watch-sessions.service';

@Module({
  imports: [TypeOrmModule.forFeature([WatchSession, Video, User]), UserSessionsModule, GoHighLevelModule],
  providers: [WatchSessionsService],
  controllers: [WatchSessionsController],
  exports: [WatchSessionsService],
})
export class WatchSessionsModule {}
