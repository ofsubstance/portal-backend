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
import { durationToMinutes } from '../utils/date-helpers.util';

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

        // Convert duration to minutes
        const durationMinutes = video ? durationToMinutes(video.duration) : 0;

        return {
          videoId: stats.videoId,
          title: video?.title || 'Unknown',
          genre: video?.genre || 'Unknown',
          duration: video?.duration || 'Unknown',
          durationMinutes: Math.round(durationMinutes * 100) / 100,
          averageCompletion: Math.round(avgCompletion * 100) / 100,
          totalSessions: stats.totalSessions,
          totalTimeWatchedMinutes:
            Math.round(stats.totalTimeWatched * 100) / 100,
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
      // Get all videos first
      const videos = await this.videoRepo.find({
        select: ['id', 'title', 'genre', 'duration', 'tags'],
      });

      const engagementScores = await Promise.all(
        videos.map(async (video) => {
          // Get watch sessions
          const watchSessions = await this.watchSessionRepo.find({
            where: {
              videoId: video.id,
              startTime: Between(startDate, endDate),
            },
            select: ['percentageWatched', 'userSessionId'],
          });

          // Get comments
          const comments = await this.commentRepo.find({
            where: {
              video: { id: video.id },
              createdAt: Between(startDate, endDate),
            },
          });

          // Get feedback
          const feedbacks = await this.feedbackRepo.find({
            where: {
              video: { id: video.id },
              createdAt: Between(startDate, endDate),
            },
          });

          // Get shares
          const shares = await this.shareableLinkRepo.find({
            where: {
              video: { id: video.id },
              createdAt: Between(startDate, endDate),
            },
          });

          // Calculate metrics
          const totalViews = watchSessions.length;
          const uniqueViewers = new Set(
            watchSessions
              .filter((s) => s.userSessionId)
              .map((s) => s.userSessionId),
          ).size;

          const avgCompletion =
            watchSessions.length > 0
              ? watchSessions.reduce((sum, session) => {
                  const percentage = parseFloat(
                    session.percentageWatched?.toString() || '0',
                  );
                  return !isNaN(percentage) ? sum + percentage : sum;
                }, 0) / watchSessions.length
              : 0;

          const avgEngagementLevel =
            feedbacks.length > 0
              ? feedbacks.reduce((sum, feedback) => {
                  return sum + (feedback.engagementLevel || 0);
                }, 0) / feedbacks.length
              : 0;

          const avgRecommendLikelihood =
            feedbacks.length > 0
              ? feedbacks.reduce((sum, feedback) => {
                  return sum + (feedback.recommendLikelihood || 0);
                }, 0) / feedbacks.length
              : 0;

          // Calculate weighted engagement score
          // Weights: Completion (40%), Engagement Level (20%), Recommend (15%),
          // Comments (15%), Shares (10%)
          const completionScore = (avgCompletion / 100) * 40;
          const engagementLevelScore = (avgEngagementLevel / 5) * 20;
          const recommendScore = (avgRecommendLikelihood / 5) * 15;
          const commentScore = Math.min(comments.length / 10, 1) * 15;
          const shareScore = Math.min(shares.length / 5, 1) * 10;

          const engagementScore =
            Math.round(
              (completionScore +
                engagementLevelScore +
                recommendScore +
                commentScore +
                shareScore) *
                100,
            ) / 100;

          return {
            videoId: video.id,
            title: video.title,
            genre: video.genre,
            duration: video.duration,
            tags: video.tags,
            engagementScore,
            metrics: {
              totalViews,
              uniqueViewers,
              avgCompletion: Math.round(avgCompletion * 100) / 100,
              commentCount: comments.length,
              feedbackCount: feedbacks.length,
              shareCount: shares.length,
              avgEngagementLevel: Math.round(avgEngagementLevel * 100) / 100,
              avgRecommendLikelihood:
                Math.round(avgRecommendLikelihood * 100) / 100,
            },
          };
        }),
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
      // Get all videos first
      const videos = await this.videoRepo.find({
        select: ['id', 'title', 'duration', 'genre'],
      });

      const retentionAnalysis = await Promise.all(
        videos.map(async (video) => {
          // Get watch sessions for this video
          const watchSessions = await this.watchSessionRepo.find({
            where: {
              videoId: video.id,
              startTime: Between(startDate, endDate),
            },
            select: ['percentageWatched', 'actualTimeWatched'],
          });

          if (watchSessions.length === 0) {
            return null;
          }

          // Convert duration to minutes
          const durationMinutes = durationToMinutes(video.duration);

          // Calculate retention metrics
          let highRetention = 0;
          let mediumRetention = 0;
          let lowRetention = 0;
          let totalWatchTimeMinutes = 0;
          let avgWatchTimeMinutes = 0;

          watchSessions.forEach((session) => {
            const percentageWatched = parseFloat(
              session.percentageWatched?.toString() || '0',
            );
            const timeWatchedMinutes = parseFloat(
              session.actualTimeWatched?.toString() || '0',
            );

            if (percentageWatched >= 80) {
              highRetention++;
            } else if (percentageWatched >= 50) {
              mediumRetention++;
            } else {
              lowRetention++;
            }

            totalWatchTimeMinutes += timeWatchedMinutes;
          });

          avgWatchTimeMinutes = totalWatchTimeMinutes / watchSessions.length;

          // Calculate drop-off points (in minutes)
          const dropOffPoints = watchSessions
            .map((session) => {
              const timeWatchedMinutes = parseFloat(
                session.actualTimeWatched?.toString() || '0',
              );
              return Math.round(timeWatchedMinutes * 100) / 100;
            })
            .sort((a, b) => a - b);

          const quartiles = {
            q1: dropOffPoints[Math.floor(dropOffPoints.length * 0.25)],
            median: dropOffPoints[Math.floor(dropOffPoints.length * 0.5)],
            q3: dropOffPoints[Math.floor(dropOffPoints.length * 0.75)],
          };

          // Calculate retention rates
          const totalSessions = watchSessions.length;
          const retentionRates = {
            highRetentionRate: Math.round(
              (highRetention / totalSessions) * 100,
            ),
            mediumRetentionRate: Math.round(
              (mediumRetention / totalSessions) * 100,
            ),
            lowRetentionRate: Math.round((lowRetention / totalSessions) * 100),
          };

          return {
            videoId: video.id,
            title: video.title,
            genre: video.genre,
            duration: video.duration,
            durationMinutes: Math.round(durationMinutes * 100) / 100,
            totalSessions,
            retentionBreakdown: {
              highRetention,
              mediumRetention,
              lowRetention,
              ...retentionRates,
            },
            watchTimeAnalysis: {
              totalWatchTimeMinutes:
                Math.round(totalWatchTimeMinutes * 100) / 100,
              averageWatchTimeMinutes:
                Math.round(avgWatchTimeMinutes * 100) / 100,
              dropOffQuartilesMinutes: quartiles,
            },
            insights: {
              retentionQuality:
                retentionRates.highRetentionRate >= 70
                  ? 'Excellent'
                  : retentionRates.highRetentionRate >= 50
                    ? 'Good'
                    : retentionRates.highRetentionRate >= 30
                      ? 'Fair'
                      : 'Needs Improvement',
              dropOffPattern:
                quartiles.q1 < durationMinutes * 0.25
                  ? 'Early Drop-off'
                  : quartiles.median < durationMinutes * 0.5
                    ? 'Mid-point Drop-off'
                    : 'Late Drop-off',
              recommendedActions: [
                retentionRates.lowRetentionRate > 40
                  ? 'Consider reviewing content length and engagement'
                  : null,
                quartiles.q1 < durationMinutes * 0.25
                  ? 'Evaluate opening sequence and hook'
                  : null,
                retentionRates.highRetentionRate < 30
                  ? 'Review content quality and target audience fit'
                  : null,
              ].filter(Boolean),
            },
          };
        }),
      );

      // Filter out null entries and sort by high retention rate
      const validAnalysis = retentionAnalysis
        .filter(Boolean)
        .sort(
          (a, b) =>
            b.retentionBreakdown.highRetentionRate -
            a.retentionBreakdown.highRetentionRate,
        );

      return successHandler(
        'Audience retention analysis retrieved successfully',
        {
          startDate,
          endDate,
          data: validAnalysis,
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
