import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from 'src/entities/comments.entity';
import { Feedback } from 'src/entities/feedbacks.entity';
import { ShareableLink } from 'src/entities/sharable_links.entity';
import { ShareableLinkEngagement } from 'src/entities/shareable_link_engagements.entity';
import { User } from 'src/entities/users.entity';
import { Video } from 'src/entities/videos.entity';
import { WatchSession } from 'src/entities/watch_sessions.entity';
import { successHandler } from 'src/utils/response.handler';
import { Between, In, Repository } from 'typeorm';

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
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
  ) {}

  async getVideoCompletionRates(startDate: Date, endDate: Date) {
    this.logger.log(
      `Getting video completion rates from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    try {
      // Get all watch sessions in the date range
      const watchSessions = await this.watchSessionRepo.find({
        where: {
          startTime: Between(startDate, endDate),
        },
        select: ['videoId', 'percentageWatched', 'actualTimeWatched'],
      });

      if (watchSessions.length === 0) {
        return successHandler(
          'No video completion data found for the specified period',
          {
            startDate,
            endDate,
            data: [],
          },
        );
      }

      // Group by video and calculate stats
      const videoStats = new Map();

      watchSessions.forEach((session) => {
        const videoId = session.videoId;
        const percentageWatched = parseFloat(
          session.percentageWatched?.toString() || '0',
        );
        const timeWatched = parseFloat(
          session.actualTimeWatched?.toString() || '0',
        );

        if (!videoStats.has(videoId)) {
          videoStats.set(videoId, {
            videoId,
            sessions: [],
            totalSessions: 0,
            totalPercentageSum: 0,
            totalTimeWatched: 0,
          });
        }

        const stats = videoStats.get(videoId);
        stats.sessions.push(session);
        stats.totalSessions++;
        stats.totalPercentageSum += percentageWatched;
        stats.totalTimeWatched += timeWatched;
      });

      // Get video details
      const videoIds = Array.from(videoStats.keys());
      const videos = await this.videoRepo.find({
        where: { id: In(videoIds) },
        select: ['id', 'title', 'duration', 'genre'],
      });

      // Calculate completion rates and combine with video details
      const completionRates = Array.from(videoStats.values()).map((stats) => {
        const video = videos.find((v) => v.id === stats.videoId);
        const avgCompletion =
          stats.totalSessions > 0
            ? stats.totalPercentageSum / stats.totalSessions
            : 0;

        return {
          videoId: stats.videoId,
          title: video?.title || 'Unknown',
          genre: video?.genre || 'Unknown',
          duration: video?.duration || 'Unknown',
          averageCompletion: Math.round(avgCompletion * 100) / 100,
          totalSessions: stats.totalSessions,
          totalTimeWatched: Math.round(stats.totalTimeWatched * 100) / 100,
        };
      });

      // Sort by average completion rate descending
      completionRates.sort((a, b) => b.averageCompletion - a.averageCompletion);

      return successHandler('Video completion rates retrieved successfully', {
        startDate,
        endDate,
        data: completionRates,
      });
    } catch (error) {
      this.logger.error('Error getting video completion rates:', error);
      throw error;
    }
  }

  async getMostViewedVideos(startDate: Date, endDate: Date) {
    this.logger.log(
      `Getting most viewed videos from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    try {
      // Get all watch sessions in the date range
      const watchSessions = await this.watchSessionRepo.find({
        where: {
          startTime: Between(startDate, endDate),
        },
        select: ['videoId', 'percentageWatched', 'userSessionId'],
      });

      if (watchSessions.length === 0) {
        return successHandler(
          'No video view data found for the specified period',
          {
            startDate,
            endDate,
            data: [],
          },
        );
      }

      // Group by video and calculate stats
      const videoStats = new Map();

      watchSessions.forEach((session) => {
        const videoId = session.videoId;
        const percentageWatched = parseFloat(
          session.percentageWatched?.toString() || '0',
        );

        if (!videoStats.has(videoId)) {
          videoStats.set(videoId, {
            videoId,
            viewCount: 0,
            totalPercentageSum: 0,
            uniqueViewers: new Set(),
          });
        }

        const stats = videoStats.get(videoId);
        stats.viewCount++;
        stats.totalPercentageSum += percentageWatched;

        if (session.userSessionId) {
          stats.uniqueViewers.add(session.userSessionId);
        }
      });

      // Get video details
      const videoIds = Array.from(videoStats.keys());
      const videos = await this.videoRepo.find({
        where: { id: In(videoIds) },
        select: ['id', 'title', 'genre', 'duration', 'tags'],
      });

      // Combine stats with video details
      const viewedVideos = Array.from(videoStats.values())
        .map((stats) => {
          const video = videos.find((v) => v.id === stats.videoId);
          const avgCompletion =
            stats.viewCount > 0
              ? stats.totalPercentageSum / stats.viewCount
              : 0;

          return {
            videoId: stats.videoId,
            title: video?.title || 'Unknown',
            genre: video?.genre || 'Unknown',
            duration: video?.duration || 'Unknown',
            tags: video?.tags || [],
            viewCount: stats.viewCount,
            uniqueViewers: stats.uniqueViewers.size,
            averageCompletion: Math.round(avgCompletion * 100) / 100,
          };
        })
        .sort((a, b) => b.viewCount - a.viewCount);

      return successHandler('Most viewed videos retrieved successfully', {
        startDate,
        endDate,
        data: viewedVideos,
      });
    } catch (error) {
      this.logger.error('Error getting most viewed videos:', error);
      throw error;
    }
  }

  async getMostSharedVideos(startDate: Date, endDate: Date) {
    this.logger.log(
      `Getting most shared videos from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    try {
      // Get share counts for each video
      const shareableLinks = await this.shareableLinkRepo.find({
        where: {
          createdAt: Between(startDate, endDate),
        },
        select: ['views'],
        relations: ['video'],
      });

      if (shareableLinks.length === 0) {
        return successHandler(
          'No video share data found for the specified period',
          {
            startDate,
            endDate,
            data: [],
          },
        );
      }

      // Group by video and calculate stats
      const videoStats = new Map();

      shareableLinks.forEach((link) => {
        const videoId = link.video?.id;
        if (!videoId) return; // Skip if no video relation

        const views = parseInt(link.views?.toString() || '0');

        if (!videoStats.has(videoId)) {
          videoStats.set(videoId, {
            videoId,
            shareCount: 0,
            totalViews: 0,
          });
        }

        const stats = videoStats.get(videoId);
        stats.shareCount++;
        stats.totalViews += views;
      });

      // Get video details
      const videoIds = Array.from(videoStats.keys());
      const videos = await this.videoRepo.find({
        where: { id: In(videoIds) },
        select: ['id', 'title', 'genre', 'duration'],
      });

      // Combine stats with video details
      const sharedVideos = Array.from(videoStats.values())
        .map((stats) => {
          const video = videos.find((v) => v.id === stats.videoId);

          return {
            videoId: stats.videoId,
            title: video?.title || 'Unknown',
            genre: video?.genre || 'Unknown',
            duration: video?.duration || 'Unknown',
            shareCount: stats.shareCount,
            totalViews: stats.totalViews,
            averageViewsPerShare:
              stats.shareCount > 0
                ? Math.round((stats.totalViews / stats.shareCount) * 100) / 100
                : 0,
          };
        })
        .sort((a, b) => b.shareCount - a.shareCount);

      return successHandler('Most shared videos retrieved successfully', {
        startDate,
        endDate,
        data: sharedVideos,
      });
    } catch (error) {
      this.logger.error('Error getting most shared videos:', error);
      throw error;
    }
  }

  async getLinkClickthroughRates(startDate: Date, endDate: Date) {
    this.logger.log(
      `Getting link clickthrough rates from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    try {
      // Get shareable links created in the date range
      const shareableLinks = await this.shareableLinkRepo.find({
        where: {
          createdAt: Between(startDate, endDate),
        },
        select: ['id', 'views'],
        relations: ['video', 'engagements'],
      });

      if (shareableLinks.length === 0) {
        return successHandler(
          'No link engagement data found for the specified period',
          {
            startDate,
            endDate,
            data: [],
          },
        );
      }

      // Group by video and calculate stats
      const videoStats = new Map();

      shareableLinks.forEach((link) => {
        const videoId = link.video?.id;
        if (!videoId) return; // Skip if no video relation

        const views = parseInt(link.views?.toString() || '0');

        if (!videoStats.has(videoId)) {
          videoStats.set(videoId, {
            videoId,
            totalLinks: 0,
            totalViews: 0,
            uniqueEngagements: 0,
          });
        }

        const stats = videoStats.get(videoId);
        stats.totalLinks++;
        stats.totalViews += views;

        // Count engagements for this link within the date range
        if (link.engagements) {
          const relevantEngagements = link.engagements.filter((engagement) => {
            const engagementTime = new Date(engagement.engagement_time);
            return engagementTime >= startDate && engagementTime <= endDate;
          });
          stats.uniqueEngagements += relevantEngagements.length;
        }
      });

      // Get video details
      const videoIds = Array.from(videoStats.keys());
      const videos = await this.videoRepo.find({
        where: { id: In(videoIds) },
        select: ['id', 'title', 'genre'],
      });

      // Calculate clickthrough rates and combine with video details
      const clickthroughRates = Array.from(videoStats.values())
        .map((stats) => {
          const video = videos.find((v) => v.id === stats.videoId);

          return {
            videoId: stats.videoId,
            title: video?.title || 'Unknown',
            genre: video?.genre || 'Unknown',
            totalLinks: stats.totalLinks,
            totalViews: stats.totalViews,
            uniqueEngagements: stats.uniqueEngagements,
            clickthroughRate:
              stats.totalViews > 0
                ? Math.round(
                    (stats.uniqueEngagements / stats.totalViews) * 100 * 100,
                  ) / 100
                : 0,
          };
        })
        .sort((a, b) => b.clickthroughRate - a.clickthroughRate);

      return successHandler('Link clickthrough rates retrieved successfully', {
        startDate,
        endDate,
        data: clickthroughRates,
      });
    } catch (error) {
      this.logger.error('Error getting link clickthrough rates:', error);
      throw error;
    }
  }

  // NEW MACRO ENGAGEMENT METRICS

  async getContentEngagementScores(startDate: Date, endDate: Date) {
    this.logger.log(
      `Getting content engagement scores from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    try {
      // Get comprehensive engagement data per video
      const watchSessions = await this.watchSessionRepo.find({
        where: {
          startTime: Between(startDate, endDate),
        },
        select: [
          'videoId',
          'percentageWatched',
          'actualTimeWatched',
          'userSessionId',
        ],
      });

      if (watchSessions.length === 0) {
        return successHandler(
          'No engagement data found for the specified period',
          {
            startDate,
            endDate,
            data: [],
          },
        );
      }

      // Group watch session data by video
      const videoEngagementData = new Map();

      watchSessions.forEach((session) => {
        const videoId = session.videoId;
        const percentageWatched = parseFloat(
          session.percentageWatched?.toString() || '0',
        );
        const timeWatched = parseFloat(
          session.actualTimeWatched?.toString() || '0',
        );

        if (!videoEngagementData.has(videoId)) {
          videoEngagementData.set(videoId, {
            videoId,
            totalViews: 0,
            totalPercentageSum: 0,
            totalTimeWatched: 0,
            uniqueViewers: new Set(),
          });
        }

        const data = videoEngagementData.get(videoId);
        data.totalViews++;
        data.totalPercentageSum += percentageWatched;
        data.totalTimeWatched += timeWatched;

        if (session.userSessionId) {
          data.uniqueViewers.add(session.userSessionId);
        }
      });

      const videoIds = Array.from(videoEngagementData.keys());

      // Get comments for these videos
      const comments = await this.commentRepo.find({
        where: {
          createdAt: Between(startDate, endDate),
          video: { id: In(videoIds) },
        },
        select: ['video'],
        relations: ['video'],
      });

      // Get feedback for these videos
      const feedbacks = await this.feedbackRepo.find({
        where: {
          createdAt: Between(startDate, endDate),
          video: { id: In(videoIds) },
        },
        select: ['video', 'engagementLevel', 'recommendLikelihood'],
        relations: ['video'],
      });

      // Get shares for these videos
      const shares = await this.shareableLinkRepo.find({
        where: {
          createdAt: Between(startDate, endDate),
          video: { id: In(videoIds) },
        },
        select: ['video'],
        relations: ['video'],
      });

      // Group additional data by video
      const videoComments = new Map();
      const videoFeedbacks = new Map();
      const videoShares = new Map();

      comments.forEach((comment) => {
        const videoId = comment.video?.id;
        if (videoId) {
          videoComments.set(videoId, (videoComments.get(videoId) || 0) + 1);
        }
      });

      feedbacks.forEach((feedback) => {
        const videoId = feedback.video?.id;
        if (videoId) {
          if (!videoFeedbacks.has(videoId)) {
            videoFeedbacks.set(videoId, {
              count: 0,
              engagementLevelSum: 0,
              recommendLikelihoodSum: 0,
            });
          }

          const stats = videoFeedbacks.get(videoId);
          stats.count++;
          stats.engagementLevelSum += parseFloat(
            feedback.engagementLevel?.toString() || '0',
          );
          stats.recommendLikelihoodSum += parseFloat(
            feedback.recommendLikelihood?.toString() || '0',
          );
        }
      });

      shares.forEach((share) => {
        const videoId = share.video?.id;
        if (videoId) {
          videoShares.set(videoId, (videoShares.get(videoId) || 0) + 1);
        }
      });

      // Get video details
      const videos = await this.videoRepo.find({
        where: { id: In(videoIds) },
        select: ['id', 'title', 'genre', 'duration', 'tags'],
      });

      // Calculate engagement scores
      const engagementScores = Array.from(videoEngagementData.values()).map(
        (data) => {
          const video = videos.find((v) => v.id === data.videoId);

          const totalViews = data.totalViews;
          const avgCompletion =
            totalViews > 0 ? data.totalPercentageSum / totalViews : 0;
          const uniqueViewers = data.uniqueViewers.size;
          const commentCount = videoComments.get(data.videoId) || 0;
          const shareCount = videoShares.get(data.videoId) || 0;

          const feedbackStats = videoFeedbacks.get(data.videoId);
          const feedbackCount = feedbackStats?.count || 0;
          const avgEngagementLevel =
            feedbackCount > 0
              ? feedbackStats.engagementLevelSum / feedbackCount
              : 0;
          const avgRecommendLikelihood =
            feedbackCount > 0
              ? feedbackStats.recommendLikelihoodSum / feedbackCount
              : 0;

          // Calculate engagement score (weighted formula)
          const completionWeight = 0.3;
          const commentWeight = 0.2;
          const feedbackWeight = 0.2;
          const shareWeight = 0.2;
          const ratingWeight = 0.1;

          // Protect against division by zero
          const commentRatio =
            totalViews > 0 ? (commentCount / totalViews) * 100 : 0;
          const feedbackRatio =
            totalViews > 0 ? (feedbackCount / totalViews) * 100 : 0;
          const shareRatio =
            totalViews > 0 ? (shareCount / totalViews) * 100 : 0;

          const engagementScore =
            Math.round(
              (avgCompletion * completionWeight +
                commentRatio * commentWeight +
                feedbackRatio * feedbackWeight +
                shareRatio * shareWeight +
                avgEngagementLevel * 20 * ratingWeight) *
                100,
            ) / 100;

          return {
            videoId: data.videoId,
            title: video?.title || 'Unknown',
            genre: video?.genre || 'Unknown',
            duration: video?.duration || 'Unknown',
            tags: video?.tags || [],
            engagementScore,
            metrics: {
              totalViews,
              uniqueViewers,
              avgCompletion: Math.round(avgCompletion * 100) / 100,
              commentCount,
              feedbackCount,
              shareCount,
              avgEngagementLevel: Math.round(avgEngagementLevel * 100) / 100,
              avgRecommendLikelihood:
                Math.round(avgRecommendLikelihood * 100) / 100,
            },
          };
        },
      );

      // Sort by engagement score descending
      engagementScores.sort((a, b) => b.engagementScore - a.engagementScore);

      return successHandler(
        'Content engagement scores retrieved successfully',
        {
          startDate,
          endDate,
          data: engagementScores,
        },
      );
    } catch (error) {
      this.logger.error('Error getting content engagement scores:', error);
      throw error;
    }
  }

  async getAudienceRetentionAnalysis(startDate: Date, endDate: Date) {
    this.logger.log(
      `Getting audience retention analysis from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    try {
      // Get retention data by video
      const retentionData = await this.watchSessionRepo
        .createQueryBuilder('watch_session')
        .select([
          'watch_session.videoId',
          'COUNT(*) as totalSessions',
          'SUM(CASE WHEN CAST(watch_session.percentageWatched AS DECIMAL) >= 0.8 THEN 1 ELSE 0 END) as highRetention',
          'SUM(CASE WHEN CAST(watch_session.percentageWatched AS DECIMAL) BETWEEN 0.5 AND 0.79 THEN 1 ELSE 0 END) as mediumRetention',
          'SUM(CASE WHEN CAST(watch_session.percentageWatched AS DECIMAL) < 0.5 THEN 1 ELSE 0 END) as lowRetention',
          'AVG(CAST(watch_session.percentageWatched AS DECIMAL)) as avgRetention',
        ])
        .where('watch_session.startTime >= :startDate', { startDate })
        .andWhere('watch_session.startTime <= :endDate', { endDate })
        .groupBy('watch_session.videoId')
        .getRawMany();

      if (retentionData.length === 0) {
        return successHandler(
          'No retention data found for the specified period',
          {
            startDate,
            endDate,
            data: [],
          },
        );
      }

      // Get video details
      const videoIds = retentionData.map((data) => data.watch_session_videoId);
      const videos = await this.videoRepo.find({
        where: { id: In(videoIds) },
        select: ['id', 'title', 'genre', 'duration'],
      });

      // Calculate retention analysis
      const retentionAnalysis = retentionData.map((data) => {
        const video = videos.find((v) => v.id === data.watch_session_videoId);
        const totalSessions = parseInt(data.totalSessions) || 0;
        const highRetention = parseInt(data.highRetention) || 0;
        const mediumRetention = parseInt(data.mediumRetention) || 0;
        const lowRetention = parseInt(data.lowRetention) || 0;
        const avgRetention = parseFloat(data.avgRetention) || 0;

        return {
          videoId: data.watch_session_videoId,
          title: video?.title || 'Unknown',
          genre: video?.genre || 'Unknown',
          duration: video?.duration || 'Unknown',
          totalSessions,
          retentionBreakdown: {
            high: {
              count: highRetention,
              percentage:
                totalSessions > 0
                  ? Math.round((highRetention / totalSessions) * 100 * 100) /
                    100
                  : 0,
            },
            medium: {
              count: mediumRetention,
              percentage:
                totalSessions > 0
                  ? Math.round((mediumRetention / totalSessions) * 100 * 100) /
                    100
                  : 0,
            },
            low: {
              count: lowRetention,
              percentage:
                totalSessions > 0
                  ? Math.round((lowRetention / totalSessions) * 100 * 100) / 100
                  : 0,
            },
          },
          avgRetention: Math.round(avgRetention * 100 * 100) / 100,
        };
      });

      // Sort by average retention descending
      retentionAnalysis.sort((a, b) => b.avgRetention - a.avgRetention);

      return successHandler(
        'Audience retention analysis retrieved successfully',
        {
          startDate,
          endDate,
          data: retentionAnalysis,
        },
      );
    } catch (error) {
      this.logger.error('Error getting audience retention analysis:', error);
      throw error;
    }
  }

  async getTopPerformingGenres(startDate: Date, endDate: Date) {
    this.logger.log(
      `Getting top performing genres from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    try {
      // Get video IDs and their watch data
      const watchData = await this.watchSessionRepo
        .createQueryBuilder('watch_session')
        .select([
          'watch_session.videoId',
          'COUNT(*) as totalViews',
          'AVG(CAST(watch_session.percentageWatched AS DECIMAL)) as avgCompletion',
          'SUM(CAST(watch_session.actualTimeWatched AS DECIMAL)) as totalTimeWatched',
        ])
        .where('watch_session.startTime >= :startDate', { startDate })
        .andWhere('watch_session.startTime <= :endDate', { endDate })
        .groupBy('watch_session.videoId')
        .getRawMany();

      if (watchData.length === 0) {
        return successHandler('No watch data found for the specified period', {
          startDate,
          endDate,
          data: [],
        });
      }

      // Get video details with genres
      const videoIds = watchData.map((data) => data.watch_session_videoId);
      const videos = await this.videoRepo.find({
        where: { id: In(videoIds) },
        select: ['id', 'title', 'genre'],
      });

      // Aggregate data by genre
      const genreStats = new Map();

      watchData.forEach((data) => {
        const video = videos.find((v) => v.id === data.watch_session_videoId);
        const genre = video?.genre || 'Unknown';
        const totalViews = parseInt(data.totalViews) || 0;
        const avgCompletion = parseFloat(data.avgCompletion) || 0;
        const totalTimeWatched = parseFloat(data.totalTimeWatched) || 0;

        if (!genreStats.has(genre)) {
          genreStats.set(genre, {
            genre,
            totalViews: 0,
            totalTimeWatched: 0,
            totalCompletionSum: 0,
            videoCount: 0,
          });
        }

        const stats = genreStats.get(genre);
        stats.totalViews += totalViews;
        stats.totalTimeWatched += totalTimeWatched;
        stats.totalCompletionSum += avgCompletion * totalViews;
        stats.videoCount++;
      });

      // Calculate averages and format results
      const genrePerformance = Array.from(genreStats.values()).map((stats) => ({
        genre: stats.genre,
        totalViews: stats.totalViews,
        totalTimeWatched: Math.round(stats.totalTimeWatched * 100) / 100,
        avgCompletion:
          stats.totalViews > 0
            ? Math.round((stats.totalCompletionSum / stats.totalViews) * 100) /
              100
            : 0,
        videoCount: stats.videoCount,
        avgViewsPerVideo:
          stats.videoCount > 0
            ? Math.round((stats.totalViews / stats.videoCount) * 100) / 100
            : 0,
      }));

      // Sort by total views descending
      genrePerformance.sort((a, b) => b.totalViews - a.totalViews);

      return successHandler('Top performing genres retrieved successfully', {
        startDate,
        endDate,
        data: genrePerformance,
      });
    } catch (error) {
      this.logger.error('Error getting top performing genres:', error);
      throw error;
    }
  }

  async getViewingPatternsAnalysis(startDate: Date, endDate: Date) {
    this.logger.log(
      `Getting viewing patterns analysis from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    try {
      // Get all watch sessions in the date range
      const watchSessions = await this.watchSessionRepo.find({
        where: {
          startTime: Between(startDate, endDate),
        },
        select: [
          'videoId',
          'percentageWatched',
          'actualTimeWatched',
          'startTime',
          'endTime',
          'userSessionId',
        ],
      });

      if (watchSessions.length === 0) {
        return successHandler(
          'No viewing pattern data found for the specified period',
          {
            startDate,
            endDate,
            data: {},
          },
        );
      }

      // Get comments and feedback for interaction analysis
      const comments = await this.commentRepo.find({
        where: {
          createdAt: Between(startDate, endDate),
        },
        select: ['video', 'createdAt'],
        relations: ['video'],
      });

      const feedbacks = await this.feedbackRepo.find({
        where: {
          createdAt: Between(startDate, endDate),
        },
        select: ['video', 'createdAt'],
        relations: ['video'],
      });

      // Analyze completion distribution
      const completionBuckets = {
        '0-25%': 0,
        '25-50%': 0,
        '50-75%': 0,
        '75-100%': 0,
      };

      const sessionDurations = [];
      const viewingHours = Array(24).fill(0);

      watchSessions.forEach((session) => {
        const percentageWatched = parseFloat(
          session.percentageWatched?.toString() || '0',
        );
        const timeWatched = parseFloat(
          session.actualTimeWatched?.toString() || '0',
        );

        // Categorize completion
        if (percentageWatched < 25) {
          completionBuckets['0-25%']++;
        } else if (percentageWatched < 50) {
          completionBuckets['25-50%']++;
        } else if (percentageWatched < 75) {
          completionBuckets['50-75%']++;
        } else {
          completionBuckets['75-100%']++;
        }

        // Calculate session duration
        if (session.startTime && session.endTime) {
          const duration =
            (new Date(session.endTime).getTime() -
              new Date(session.startTime).getTime()) /
            1000;
          sessionDurations.push(duration);
        }

        // Track viewing hours
        if (session.startTime) {
          const hour = new Date(session.startTime).getHours();
          if (hour >= 0 && hour < 24) {
            viewingHours[hour]++;
          }
        }
      });

      // Calculate completion percentages
      const totalSessions = watchSessions.length;
      const completionDistribution = Object.entries(completionBuckets).map(
        ([range, count]) => ({
          range,
          count,
          percentage:
            totalSessions > 0
              ? Math.round((count / totalSessions) * 100 * 100) / 100
              : 0,
        }),
      );

      // Calculate session duration stats
      const avgSessionDuration =
        sessionDurations.length > 0
          ? Math.round(
              sessionDurations.reduce((sum, duration) => sum + duration, 0) /
                sessionDurations.length,
            )
          : 0;

      // Count interactions by video
      const videoInteractions = new Map();

      comments.forEach((comment) => {
        const videoId = comment.video?.id;
        if (videoId) {
          videoInteractions.set(
            videoId,
            (videoInteractions.get(videoId) || 0) + 1,
          );
        }
      });

      feedbacks.forEach((feedback) => {
        const videoId = feedback.video?.id;
        if (videoId) {
          videoInteractions.set(
            videoId,
            (videoInteractions.get(videoId) || 0) + 1,
          );
        }
      });

      // Calculate interaction stats
      const totalInteractions = Array.from(videoInteractions.values()).reduce(
        (sum, count) => sum + count,
        0,
      );
      const avgInteractionsPerVideo =
        videoInteractions.size > 0
          ? Math.round((totalInteractions / videoInteractions.size) * 100) / 100
          : 0;

      // Find peak viewing hours
      const peakHours = viewingHours
        .map((count, hour) => ({ hour, count }))
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map((item) => ({
          hour: `${item.hour}:00`,
          sessions: item.count,
        }));

      // Calculate unique viewers
      const uniqueViewers = new Set(
        watchSessions.map((s) => s.userSessionId).filter((id) => id),
      ).size;

      return successHandler(
        'Viewing patterns analysis retrieved successfully',
        {
          startDate,
          endDate,
          data: {
            totalSessions,
            uniqueViewers,
            completionDistribution,
            sessionDurations: {
              average: avgSessionDuration,
              totalSessions: sessionDurations.length,
            },
            interactions: {
              totalInteractions,
              avgInteractionsPerVideo,
              videosWithInteractions: videoInteractions.size,
            },
            peakViewingHours: peakHours,
            hourlyDistribution: viewingHours.map((count, hour) => ({
              hour: `${hour}:00`,
              sessions: count,
            })),
          },
        },
      );
    } catch (error) {
      this.logger.error('Error getting viewing patterns analysis:', error);
      throw error;
    }
  }
}
