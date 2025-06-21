import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ShareableLink } from 'src/entities/sharable_links.entity';
import { ShareableLinkEngagement } from 'src/entities/shareable_link_engagements.entity';
import { Video } from 'src/entities/videos.entity';
import { WatchSession } from 'src/entities/watch_sessions.entity';
import { successHandler } from 'src/utils/response.handler';
import { Between, Repository } from 'typeorm';

@Injectable()
export class MacroContentMetricsService {
  private readonly logger = new Logger('MacroContentMetricsService');

  constructor(
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @InjectRepository(WatchSession)
    private readonly watchSessionRepo: Repository<WatchSession>,
    @InjectRepository(ShareableLink)
    private readonly shareableLinkRepo: Repository<ShareableLink>,
    @InjectRepository(ShareableLinkEngagement)
    private readonly shareableLinkEngagementRepo: Repository<ShareableLinkEngagement>,
  ) {}

  async getVideoCompletionRates(startDate: Date, endDate: Date) {
    this.logger.log(
      `Getting video completion rates from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    // Get all watch sessions in the date range grouped by video
    const watchStats = await this.watchSessionRepo
      .createQueryBuilder('watch_session')
      .select([
        'watch_session.videoId',
        'AVG(watch_session.percentageWatched) as avgCompletion',
        'COUNT(*) as totalSessions',
      ])
      .where({
        startTime: Between(startDate, endDate),
      })
      .groupBy('watch_session.videoId')
      .getRawMany();

    // Get video details for the found sessions
    const videoIds = watchStats.map((stat) => stat.watch_session_videoId);
    const videos = await this.videoRepo.findByIds(videoIds);

    // Combine stats with video details
    const completionRates = watchStats.map((stat) => ({
      videoId: stat.watch_session_videoId,
      title:
        videos.find((v) => v.id === stat.watch_session_videoId)?.title ||
        'Unknown',
      averageCompletion: Math.round(stat.avgCompletion * 100) / 100,
      totalSessions: parseInt(stat.totalSessions),
    }));

    // Sort by average completion rate descending
    completionRates.sort((a, b) => b.averageCompletion - a.averageCompletion);

    return successHandler('Video completion rates retrieved successfully', {
      startDate,
      endDate,
      data: completionRates,
    });
  }

  async getMostViewedVideos(startDate: Date, endDate: Date) {
    this.logger.log(
      `Getting most viewed videos from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    // Get watch session counts for each video
    const viewStats = await this.watchSessionRepo
      .createQueryBuilder('watch_session')
      .select([
        'watch_session.videoId',
        'COUNT(*) as viewCount',
        'AVG(watch_session.percentageWatched) as avgCompletion',
      ])
      .where({
        startTime: Between(startDate, endDate),
      })
      .groupBy('watch_session.videoId')
      .orderBy('viewCount', 'DESC')
      .getRawMany();

    // Get video details
    const videoIds = viewStats.map((stat) => stat.watch_session_videoId);
    const videos = await this.videoRepo.findByIds(videoIds);

    // Combine stats with video details
    const viewedVideos = viewStats.map((stat) => ({
      videoId: stat.watch_session_videoId,
      title:
        videos.find((v) => v.id === stat.watch_session_videoId)?.title ||
        'Unknown',
      viewCount: parseInt(stat.viewCount),
      averageCompletion: Math.round(stat.avgCompletion * 100) / 100,
    }));

    return successHandler('Most viewed videos retrieved successfully', {
      startDate,
      endDate,
      data: viewedVideos,
    });
  }

  async getMostSharedVideos(startDate: Date, endDate: Date) {
    this.logger.log(
      `Getting most shared videos from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    // Get share counts for each video
    const shareStats = await this.shareableLinkRepo
      .createQueryBuilder('shareable_link')
      .select([
        'shareable_link.videoId',
        'COUNT(*) as shareCount',
        'SUM(shareable_link.views) as totalViews',
      ])
      .where({
        createdAt: Between(startDate, endDate),
      })
      .groupBy('shareable_link.videoId')
      .orderBy('shareCount', 'DESC')
      .getRawMany();

    // Get video details
    const videoIds = shareStats.map((stat) => stat.shareable_link_videoId);
    const videos = await this.videoRepo.findByIds(videoIds);

    // Combine stats with video details
    const sharedVideos = shareStats.map((stat) => ({
      videoId: stat.shareable_link_videoId,
      title:
        videos.find((v) => v.id === stat.shareable_link_videoId)?.title ||
        'Unknown',
      shareCount: parseInt(stat.shareCount),
      totalViews: parseInt(stat.totalViews),
      averageViewsPerShare:
        Math.round(
          (parseInt(stat.totalViews) / parseInt(stat.shareCount)) * 100,
        ) / 100,
    }));

    return successHandler('Most shared videos retrieved successfully', {
      startDate,
      endDate,
      data: sharedVideos,
    });
  }

  async getLinkClickthroughRates(startDate: Date, endDate: Date) {
    this.logger.log(
      `Getting link clickthrough rates from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    // Get engagement stats for shared links
    const engagementStats = await this.shareableLinkRepo
      .createQueryBuilder('shareable_link')
      .select([
        'shareable_link.videoId',
        'COUNT(DISTINCT shareable_link.id) as totalLinks',
        'SUM(shareable_link.views) as totalViews',
        'COUNT(DISTINCT engagement.id) as uniqueEngagements',
      ])
      .leftJoin(
        'shareable_link.engagements',
        'engagement',
        'engagement.engagement_time BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      )
      .where({
        createdAt: Between(startDate, endDate),
      })
      .groupBy('shareable_link.videoId')
      .getRawMany();

    // Get video details
    const videoIds = engagementStats.map((stat) => stat.shareable_link_videoId);
    const videos = await this.videoRepo.findByIds(videoIds);

    // Calculate clickthrough rates and combine with video details
    const clickthroughRates = engagementStats
      .map((stat) => ({
        videoId: stat.shareable_link_videoId,
        title:
          videos.find((v) => v.id === stat.shareable_link_videoId)?.title ||
          'Unknown',
        totalLinks: parseInt(stat.totalLinks),
        totalViews: parseInt(stat.totalViews),
        uniqueEngagements: parseInt(stat.uniqueEngagements),
        clickthroughRate:
          Math.round(
            (parseInt(stat.uniqueEngagements) / parseInt(stat.totalViews)) *
              100 *
              100,
          ) / 100,
      }))
      .sort((a, b) => b.clickthroughRate - a.clickthroughRate);

    return successHandler('Link clickthrough rates retrieved successfully', {
      startDate,
      endDate,
      data: clickthroughRates,
    });
  }
}
