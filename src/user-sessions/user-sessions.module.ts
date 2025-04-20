import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSession } from '../entities/user_sessions.entity';
import { UserSessionsController } from './user-sessions.controller';
import { UserSessionsService } from './user-sessions.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserSession])],
  providers: [UserSessionsService],
  controllers: [UserSessionsController],
  exports: [UserSessionsService],
})
export class UserSessionsModule {}
