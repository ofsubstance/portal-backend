import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from 'src/entities/comments.entity';
import { Feedback } from 'src/entities/feedbacks.entity';
import { LoginEvent } from 'src/entities/login_events.entity';
import { ShareableLink } from 'src/entities/sharable_links.entity';
import { Profile } from 'src/entities/user_profiles.entity';
import { UserSession } from 'src/entities/user_sessions.entity';
import { User } from 'src/entities/users.entity';
import { Video } from 'src/entities/videos.entity';
import { WatchSession } from 'src/entities/watch_sessions.entity';
import { DataExportController } from './data-export.controller';
import { DataExportService } from './data-export.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Video,
      Comment,
      Feedback,
      LoginEvent,
      Profile,
      UserSession,
      ShareableLink,
      WatchSession,
    ]),
  ],
  controllers: [DataExportController],
  providers: [DataExportService],
})
export class DataExportModule {}
