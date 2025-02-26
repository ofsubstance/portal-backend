import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ShareableLink } from 'src/entities/sharable_links.entity';
import { ShareableLinkEngagement } from 'src/entities/shareable_link_engagements.entity';
import { User } from 'src/entities/users.entity';
import { errorhandler, successHandler } from 'src/utils/response.handler';
import { Between, Repository } from 'typeorm';

import { Video } from '../entities/videos.entity';
import { CreateShareLinkDto } from './createShareLink.dto';
import { TrackLinkEngagementDto } from './trackLinkEngagement.dto';

@Injectable()
export class SharelinksService {
  constructor(
    @InjectRepository(Video) private videoRepo: Repository<Video>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(ShareableLink)
    private shareLinkRepo: Repository<ShareableLink>,
    @InjectRepository(ShareableLinkEngagement)
    private engagementRepo: Repository<ShareableLinkEngagement>,
  ) {}

  // Calculate expiration date based on validity days
  private calculateExpirationDate(validityDays: number = 30): Date {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + validityDays);
    return expirationDate;
  }

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

      const uniqueLinkId = crypto.randomUUID();
      // Generate a unique link with video id then uuid
      const uniqueLink =
        process.env.FRONTEND_URL + '/video/' + video.id + '/' + uniqueLinkId;

      // Calculate expiration date
      const expirationTime = this.calculateExpirationDate(
        createShareLinkDto.validity_days,
      );

      const shareLink = this.shareLinkRepo.create({
        user: user,
        video: video,
        expiration_time: expirationTime,
        unique_link: uniqueLink,
        unique_link_id: uniqueLinkId,
      });

      await this.shareLinkRepo.save(shareLink);
      return successHandler('Share link created successfully', {
        ...shareLink,
        unique_link: uniqueLink,
      });
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

  async getShareLinkByUniqueLink(uniqueLink: string) {
    try {
      const shareLink = await this.shareLinkRepo.findOne({
        where: { unique_link: uniqueLink },
        relations: ['video', 'user'],
      });
      if (!shareLink) {
        return errorhandler(404, 'Share link not found');
      }

      // Check if the link has expired
      if (new Date() > shareLink.expiration_time) {
        return errorhandler(400, 'Share link has expired');
      }

      return successHandler('Share link retrieved successfully', shareLink);
    } catch (error) {
      return errorhandler(500, error.message);
    }
  }

  async getShareLinkByUniqueLinkId(uniqueLinkId: string) {
    try {
      const shareLink = await this.shareLinkRepo.findOne({
        where: { unique_link_id: uniqueLinkId },
        relations: ['video', 'user'],
      });
      if (!shareLink) {
        return errorhandler(404, 'Share link not found');
      }

      // Check if the link has expired
      if (new Date() > shareLink.expiration_time) {
        return errorhandler(400, 'Share link has expired');
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
      return errorhandler(500, error.message);
    }
  }

  async trackLinkEngagement(
    uniqueLink: string,
    trackLinkEngagementDto: TrackLinkEngagementDto,
  ) {
    try {
      const shareLinkResult = await this.getShareLinkByUniqueLink(uniqueLink);
      if (shareLinkResult.statusCode !== 200) {
        return shareLinkResult;
      }

      const shareLink = shareLinkResult.body;

      // Increment views count
      await this.shareLinkRepo.update(
        { id: shareLink.id },
        { views: () => 'views + 1' },
      );

      // Check if this IP has already engaged with this link
      const existingEngagement = await this.engagementRepo.findOne({
        where: {
          shareableLink: { id: shareLink.id },
          ip_address: trackLinkEngagementDto.ip_address,
        },
      });

      // Create engagement record
      const engagement = this.engagementRepo.create({
        shareableLink: shareLink,
        ip_address: trackLinkEngagementDto.ip_address,
        user_agent: trackLinkEngagementDto.user_agent,
        referrer: trackLinkEngagementDto.referrer,
        // Mark as unique visitor only if this IP hasn't engaged before
        is_unique_visitor: existingEngagement ? false : true,
      });

      await this.engagementRepo.save(engagement);

      return successHandler('Link engagement tracked successfully', null);
    } catch (error) {
      return errorhandler(500, error.message);
    }
  }

  async trackLinkEngagementById(
    uniqueLinkId: string,
    trackLinkEngagementDto: TrackLinkEngagementDto,
  ) {
    try {
      const shareLinkResult =
        await this.getShareLinkByUniqueLinkId(uniqueLinkId);
      if (shareLinkResult.statusCode !== 200) {
        return shareLinkResult;
      }

      const shareLink = shareLinkResult.body;

      // Increment views count
      await this.shareLinkRepo.update(
        { id: shareLink.id },
        { views: () => 'views + 1' },
      );

      // Check if this IP has already engaged with this link
      const existingEngagement = await this.engagementRepo.findOne({
        where: {
          shareableLink: { id: shareLink.id },
          ip_address: trackLinkEngagementDto.ip_address,
        },
      });

      console.log(trackLinkEngagementDto);

      // Create engagement record
      const engagement = this.engagementRepo.create({
        shareableLink: shareLink,
        ip_address: trackLinkEngagementDto.ip_address,
        user_agent: trackLinkEngagementDto.user_agent,
        referrer: trackLinkEngagementDto.referrer,
        // Mark as unique visitor only if this IP hasn't engaged before
        is_unique_visitor: existingEngagement ? false : true,
      });

      await this.engagementRepo.save(engagement);

      return successHandler('Link engagement tracked successfully', null);
    } catch (error) {
      return errorhandler(500, error.message);
    }
  }

  // Analytics methods
  async getLinkAnalytics(linkId: string) {
    try {
      const shareLink = await this.shareLinkRepo.findOne({
        where: { id: linkId },
        relations: ['engagements'],
      });
      if (!shareLink) {
        return errorhandler(404, 'Share link not found');
      }

      const totalViews = shareLink.views;
      const uniqueVisitors = shareLink.engagements.filter(
        (e) => e.is_unique_visitor,
      ).length;

      return successHandler('Link analytics retrieved successfully', {
        totalViews,
        uniqueVisitors,
        engagements: shareLink.engagements,
      });
    } catch (error) {
      return errorhandler(500, error.message);
    }
  }

  async getComprehensiveAnalytics() {
    try {
      // Get all share links with their related entities
      const shareLinks = await this.shareLinkRepo.find({
        relations: ['video', 'user', 'engagements'],
      });

      // Transform the data to include analytics
      const analyticsData = shareLinks.map((shareLink) => {
        // Calculate unique visitors
        const uniqueVisitors = shareLink.engagements.filter(
          (e) => e.is_unique_visitor,
        ).length;

        // Calculate return visitors (total engagements minus unique visitors)
        const returnVisitors = shareLink.engagements.length - uniqueVisitors;

        // Get unique IP addresses
        const uniqueIps = new Set(
          shareLink.engagements.map((engagement) => engagement.ip_address),
        );

        // Calculate engagement rate (views per unique visitor)
        const engagementRate =
          uniqueVisitors > 0
            ? (shareLink.views / uniqueVisitors).toFixed(2)
            : '0';

        // Get the most recent engagement
        const mostRecentEngagement =
          shareLink.engagements.length > 0
            ? new Date(
                Math.max(
                  ...shareLink.engagements.map((e) =>
                    new Date(e.engagement_time).getTime(),
                  ),
                ),
              )
            : null;

        // Calculate days until expiration
        const now = new Date();
        const daysUntilExpiration = shareLink.expiration_time
          ? Math.ceil(
              (new Date(shareLink.expiration_time).getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0;

        // Format the data
        return {
          id: shareLink.id,
          unique_link: shareLink.unique_link,
          unique_link_id: shareLink.unique_link_id,
          created_at: shareLink.createdAt,
          expiration_time: shareLink.expiration_time,
          days_until_expiration: daysUntilExpiration,
          is_expired: daysUntilExpiration <= 0,

          // Video information
          video: {
            id: shareLink.video.id,
            title: shareLink.video.title,
            thumbnail_url: shareLink.video.thumbnail_url,
            duration: shareLink.video.duration,
            genre: shareLink.video.genre,
          },

          // User information
          user: {
            id: shareLink.user.id,
            name: `${shareLink.user.firstname} ${shareLink.user.lastname}`,
            email: shareLink.user.email,
          },

          // Analytics
          views: shareLink.views,
          unique_visitors: uniqueVisitors,
          return_visitors: returnVisitors,
          unique_ips: uniqueIps.size,
          engagement_rate: engagementRate,
          last_engagement: mostRecentEngagement,

          // Detailed engagement data (optional, can be removed if too verbose)
          engagement_details: shareLink.engagements.map((e) => ({
            time: e.engagement_time,
            ip: e.ip_address,
            is_unique: e.is_unique_visitor,
            referrer: e.referrer,
          })),
        };
      });

      return successHandler(
        'Comprehensive analytics retrieved successfully',
        analyticsData,
      );
    } catch (error) {
      return errorhandler(500, error.message);
    }
  }

  async getUserLinkAnalytics(userId: string) {
    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
      });
      if (!user) {
        return errorhandler(404, 'User not found');
      }

      // Get all links created by the user
      const shareLinks = await this.shareLinkRepo.find({
        where: { user },
        relations: ['video', 'engagements'],
      });

      // Calculate total links created this month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const linksThisMonth = await this.shareLinkRepo.count({
        where: {
          user,
          created_at: Between(firstDayOfMonth, lastDayOfMonth),
        } as any, // Type assertion to bypass TypeORM type checking
      });

      // Group links by video
      const linksByVideo = {};
      shareLinks.forEach((link) => {
        const videoId = link.video.id;
        if (!linksByVideo[videoId]) {
          linksByVideo[videoId] = {
            video: link.video,
            links: [],
            totalViews: 0,
            uniqueVisitors: 0,
          };
        }

        const uniqueVisitors = link.engagements.filter(
          (e) => e.is_unique_visitor,
        ).length;

        linksByVideo[videoId].links.push(link);
        linksByVideo[videoId].totalViews += link.views;
        linksByVideo[videoId].uniqueVisitors += uniqueVisitors;
      });

      return successHandler('User link analytics retrieved successfully', {
        totalLinks: shareLinks.length,
        linksThisMonth,
        linksByVideo,
      });
    } catch (error) {
      return errorhandler(500, error.message);
    }
  }
}
