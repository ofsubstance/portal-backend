import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ShareableLink } from 'src/entities/sharable_links.entity';
import { User } from 'src/entities/users.entity';
import { errorhandler, successHandler } from 'src/utils/response.handler';
import { Repository } from 'typeorm';
import { Video } from '../entities/videos.entity';
import { CreateShareLinkDto } from './createShareLink.dto';

@Injectable()
export class SharelinksService {
  constructor(
    @InjectRepository(Video) private videoRepo: Repository<Video>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(ShareableLink)
    private shareLinkRepo: Repository<ShareableLink>,
  ) {}

  async createShareLink(
    createShareLinkDto: CreateShareLinkDto,
    userId: string,
  ) {
    try {
      const video = await this.videoRepo.findOne({
        where: { id: createShareLinkDto.video_id },
      });
      if (!video) {
        return errorhandler(404, 'Video not found');
      }

      const user = await this.userRepo.findOne({
        where: { id: userId },
      });
      if (!user) {
        return errorhandler(404, 'User not found');
      }

      const shareLink = this.shareLinkRepo.create({
        user: user,
        video: video,
        expiration_time: createShareLinkDto.expiration_time,
      });

      await this.shareLinkRepo.save(shareLink);
      return successHandler('Share link created successfully', shareLink);
    } catch (error) {
      return errorhandler(500, error.message);
    }
  }

  async getShareLinkById(id: string) {
    try {
      const shareLink = await this.shareLinkRepo.findOne({
        where: { id },
        relations: ['video', 'user'],
      });
      if (!shareLink) {
        return errorhandler(404, 'Share link not found');
      }

      return successHandler('Share link retrieved successfully', shareLink);
    } catch (error) {
      return errorhandler(500, error.message);
    }
  }

  async getShareLinkByUserId(userId: string) {
    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
      });
      if (!user) {
        return errorhandler(404, 'User not found');
      }

      const shareLinks = await this.shareLinkRepo.find({
        where: { user },
        relations: ['video'],
      });

      return successHandler('Share links retrieved successfully', shareLinks);
    } catch (error) {
      return errorhandler(500, error.message);
    }
  }

  async getAllShareLinks() {
    try {
      const shareLinks = await this.shareLinkRepo.find({
        relations: ['video', 'user'],
      });
      return successHandler('Share links retrieved successfully', shareLinks);
    } catch (error) {
      return errorhandler(500, error.message);
    }
  }

  async deleteShareLink(id: string) {
    try {
      const shareLink = await this.shareLinkRepo.findOne({
        where: { id },
      });
      if (!shareLink) {
        return errorhandler(404, 'Share link not found');
      }

      await this.shareLinkRepo.remove(shareLink);
      return successHandler('Share link deleted successfully', null);
    } catch (error) {
      return errorhandler(error, error.message);
    }
  }
}
