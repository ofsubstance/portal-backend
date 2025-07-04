import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from 'src/entities/comments.entity';
import { Feedback } from 'src/entities/feedbacks.entity';
import { ShareableLink } from 'src/entities/sharable_links.entity';
import { UserSession } from 'src/entities/user_sessions.entity';
import { User } from 'src/entities/users.entity';
import { WatchSession } from 'src/entities/watch_sessions.entity';
import { UserContentController } from './user-content.controller';
import { UserContentService } from './user-content.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, 
      Comment, 
      Feedback, 
      ShareableLink, 
      UserSession, 
      WatchSession
    ]),
  ],
  controllers: [UsersController, UserContentController],
  providers: [UsersService, UserContentService],
  exports: [UsersService],
})
export class UsersModule {}
