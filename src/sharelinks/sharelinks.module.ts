import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareableLink } from 'src/entities/sharable_links.entity';
import { User } from 'src/entities/users.entity';
import { Video } from 'src/entities/videos.entity';
import { SharelinksController } from './sharelinks.controller';
import { SharelinksService } from './sharelinks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Video, User, ShareableLink])],
  controllers: [SharelinksController],
  providers: [SharelinksService],
})
export class SharelinksModule {}
