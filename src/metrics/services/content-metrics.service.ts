import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import { ShareableLink } from 'src/entities/sharable_links.entity';
import { Video } from 'src/entities/videos.entity';
import { WatchSession } from 'src/entities/watch_sessions.entity';
import { successHandler } from 'src/utils/response.handler';
import { Between, Repository } from 'typeorm';
import { DurationSpan } from '../enums/duration-span.enum';
import {
  createPeriodMap,
  getPeriodsInRange,
  processDateParams,
} from '../utils/date-helpers.util';

// Time periods for aggregation
export enum TimePeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

@Injectable()
export class ContentMetricsService {
  private readonly logger = new Logger('ContentMetricsService');

  constructor(
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @InjectRepository(WatchSession)
    private readonly watchSessionRepo: Repository<WatchSession>,
    @InjectRepository(ShareableLink)
    private readonly shareableLinkRepo: Repository<ShareableLink>,
  ) {}

  /**
   * Convert TimePeriod to DurationSpan
   */
  private timePeriodToDurationSpan(period: TimePeriod): DurationSpan {
    switch (period) {
      case TimePeriod.DAILY:
        return DurationSpan.DAILY;
      case TimePeriod.WEEKLY:
        return DurationSpan.WEEKLY;
      case TimePeriod.MONTHLY:
        return DurationSpan.MONTHLY;
      default:
        return DurationSpan.DAILY;
    }
  }

  /**
   * Get total views for a specific video between dates distributed by time period
   */
  async getVideoViews(
    videoId: string,
    startDate: Date,
    endDate: Date,
    period: TimePeriod = TimePeriod.DAILY,
  ) {
    this.logger.log(
      `Getting ${period} views for video ${videoId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    const span = this.timePeriodToDurationSpan(period);

    // Process the date parameters to get consistent formatting
    const {
      startPeriodString,
      endPeriodString,
      dateFormat,
      queryStartDate,
      queryEndDate,
    } = processDateParams(startDate, endDate, span);

    // Get all periods in the range for time buckets
    const periodRange = getPeriodsInRange(queryStartDate, queryEndDate, span);

    // Initialize period map with zero values
    const periodMap = createPeriodMap(periodRange, dateFormat);

    // Get all watch sessions in the time range
    const watchSessions = await this.watchSessionRepo.find({
      where: {
        videoId,
        startTime: Between(queryStartDate, queryEndDate),
      },
    });

    // Group sessions by period
    watchSessions.forEach((session) => {
      const sessionStartTime = new Date(session.startTime);
      const periodKey = format(sessionStartTime, dateFormat);

      if (periodMap.has(periodKey)) {
        periodMap.set(periodKey, periodMap.get(periodKey) + 1);
      }
    });

    // Format label based on period
    let periodLabel = 'date';
    switch (period) {
      case TimePeriod.WEEKLY:
        periodLabel = 'week';
        break;
      case TimePeriod.MONTHLY:
        periodLabel = 'month';
        break;
    }

    // Convert map to array format with appropriate period label
    const distribution = Array.from(periodMap.entries()).map(
      ([periodKey, count]) => ({
        [periodLabel]: periodKey,
        count,
      }),
    );

    const video = await this.videoRepo.findOne({ where: { id: videoId } });

    return successHandler(`${period} views retrieved for video ${videoId}`, {
      videoId,
      title: video?.title || 'Unknown',
      period,
      dateRange: {
        start: queryStartDate,
        end: queryEndDate,
      },
      totalViews: watchSessions.length,
      distribution,
    });
  }

  /**
   * Get average percentage watched for a video between dates distributed by time period
   */
  async getAveragePercentageWatched(
    videoId: string,
    startDate: Date,
    endDate: Date,
    period: TimePeriod = TimePeriod.DAILY,
  ) {
    this.logger.log(
      `Getting ${period} average percentage watched for video ${videoId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    const span = this.timePeriodToDurationSpan(period);

    // Process the date parameters to get consistent formatting
    const {
      startPeriodString,
      endPeriodString,
      dateFormat,
      queryStartDate,
      queryEndDate,
    } = processDateParams(startDate, endDate, span);

    // Get all periods in the range for time buckets
    const periodRange = getPeriodsInRange(queryStartDate, queryEndDate, span);

    // Initialize period map with accumulators for average calculation
    const periodSums = createPeriodMap(periodRange, dateFormat);
    const periodCounts = createPeriodMap(periodRange, dateFormat);

    // Get all watch sessions in the time range
    const watchSessions = await this.watchSessionRepo.find({
      where: {
        videoId,
        startTime: Between(queryStartDate, queryEndDate),
      },
      select: ['startTime', 'percentageWatched'],
    });

    // Calculate totals for each period
    let overallSum = 0;
    let overallCount = 0;

    watchSessions.forEach((session) => {
      const sessionStartTime = new Date(session.startTime);
      const periodKey = format(sessionStartTime, dateFormat);

      if (periodSums.has(periodKey)) {
        // Add to running sum for this period - ensure it's a number
        const percentageWatched = parseFloat(
          session.percentageWatched.toString(),
        );

        // Add to running sum for this period
        periodSums.set(
          periodKey,
          periodSums.get(periodKey) + percentageWatched,
        );

        // Increment count for this period
        periodCounts.set(periodKey, periodCounts.get(periodKey) + 1);

        // Add to overall totals
        overallSum += percentageWatched;
        overallCount++;
      }
    });

    // Format label based on period
    let periodLabel = 'date';
    switch (period) {
      case TimePeriod.WEEKLY:
        periodLabel = 'week';
        break;
      case TimePeriod.MONTHLY:
        periodLabel = 'month';
        break;
    }

    // Calculate averages and convert to array format
    const distribution = Array.from(periodSums.entries()).map(
      ([periodKey, sum]) => {
        const count = periodCounts.get(periodKey) || 0;
        const average = count > 0 ? Math.round((sum / count) * 100) / 100 : 0;

        return {
          [periodLabel]: periodKey,
          averagePercentage: average,
          sessionCount: count,
        };
      },
    );

    // Calculate overall average
    const overallAverage =
      overallCount > 0
        ? Math.round((overallSum / overallCount) * 100) / 100
        : 0;

    const video = await this.videoRepo.findOne({ where: { id: videoId } });

    return successHandler(
      `${period} average percentage watched retrieved for video ${videoId}`,
      {
        videoId,
        title: video?.title || 'Unknown',
        period,
        dateRange: {
          start: queryStartDate,
          end: queryEndDate,
        },
        averagePercentageWatched: overallAverage,
        totalSessions: overallCount,
        distribution,
      },
    );
  }

  /**
   * Get share count for a video between dates distributed by time period
   */
  async getShareCount(
    videoId: string,
    startDate: Date,
    endDate: Date,
    period: TimePeriod = TimePeriod.DAILY,
  ) {
    this.logger.log(
      `Getting ${period} share count for video ${videoId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    const span = this.timePeriodToDurationSpan(period);

    // Process the date parameters to get consistent formatting
    const {
      startPeriodString,
      endPeriodString,
      dateFormat,
      queryStartDate,
      queryEndDate,
    } = processDateParams(startDate, endDate, span);

    // Get all periods in the range for time buckets
    const periodRange = getPeriodsInRange(queryStartDate, queryEndDate, span);

    // Initialize period map with zero values
    const periodMap = createPeriodMap(periodRange, dateFormat);

    // Get all shareable links in the time range
    const shareableLinks = await this.shareableLinkRepo.find({
      where: {
        video: { id: videoId },
        createdAt: Between(queryStartDate, queryEndDate),
      },
    });

    // Group links by period
    shareableLinks.forEach((link) => {
      const linkCreationTime = new Date(link.createdAt);
      const periodKey = format(linkCreationTime, dateFormat);

      if (periodMap.has(periodKey)) {
        periodMap.set(periodKey, periodMap.get(periodKey) + 1);
      }
    });

    // Format label based on period
    let periodLabel = 'date';
    switch (period) {
      case TimePeriod.WEEKLY:
        periodLabel = 'week';
        break;
      case TimePeriod.MONTHLY:
        periodLabel = 'month';
        break;
    }

    // Convert map to array format with appropriate period label
    const distribution = Array.from(periodMap.entries()).map(
      ([periodKey, count]) => ({
        [periodLabel]: periodKey,
        count,
      }),
    );

    const video = await this.videoRepo.findOne({ where: { id: videoId } });

    return successHandler(
      `${period} share count retrieved for video ${videoId}`,
      {
        videoId,
        title: video?.title || 'Unknown',
        period,
        dateRange: {
          start: queryStartDate,
          end: queryEndDate,
        },
        totalShares: shareableLinks.length,
        distribution,
      },
    );
  }

  /**
   * Get completion and drop-off rates for a video between dates distributed by time period
   * Completion: percentage of users who watched more than 70% of the video
   * Drop-off: percentage of users who watched less than 30% of the video
   * Partial view: percentage of users who watched between 30% and 70% of the video
   */
  async getCompletionAndDropOffRates(
    videoId: string,
    startDate: Date,
    endDate: Date,
    period: TimePeriod = TimePeriod.DAILY,
  ) {
    this.logger.log(
      `Getting ${period} completion and drop-off rates for video ${videoId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    // Define thresholds
    const COMPLETION_THRESHOLD = 70; // 70% completion
    const DROPOFF_THRESHOLD = 30; // 30% drop-off

    const span = this.timePeriodToDurationSpan(period);

    // Process the date parameters to get consistent formatting
    const {
      startPeriodString,
      endPeriodString,
      dateFormat,
      queryStartDate,
      queryEndDate,
    } = processDateParams(startDate, endDate, span);

    // Get all periods in the range for time buckets
    const periodRange = getPeriodsInRange(queryStartDate, queryEndDate, span);

    // Initialize period maps for tracking counts
    const periodTotalSessions = createPeriodMap(periodRange, dateFormat);
    const periodCompletedSessions = createPeriodMap(periodRange, dateFormat);
    const periodPartialSessions = createPeriodMap(periodRange, dateFormat);
    const periodDroppedOffSessions = createPeriodMap(periodRange, dateFormat);

    // Get all watch sessions in the time range
    const watchSessions = await this.watchSessionRepo.find({
      where: {
        videoId,
        startTime: Between(queryStartDate, queryEndDate),
      },
      select: ['startTime', 'percentageWatched'],
    });

    // Process each session and categorize by completion status
    let totalSessions = 0;
    let completedSessions = 0;
    let partialSessions = 0;
    let droppedOffSessions = 0;

    watchSessions.forEach((session) => {
      const sessionStartTime = new Date(session.startTime);
      const periodKey = format(sessionStartTime, dateFormat);

      // Ensure percentageWatched is a number and handle both decimal formats
      const rawPercentage = parseFloat(session.percentageWatched.toString());

      // Check if the value is already in percentage form or in decimal form
      let percentageWatched;
      if (rawPercentage > 1.0) {
        // Already in percentage form, e.g., 75 means 75%
        percentageWatched = rawPercentage;
      } else {
        // In decimal form, e.g., 0.75 means 75%
        percentageWatched = rawPercentage * 100;
      }

      if (periodTotalSessions.has(periodKey)) {
        // Increment total count for this period
        periodTotalSessions.set(
          periodKey,
          periodTotalSessions.get(periodKey) + 1,
        );
        totalSessions++;

        // Check if completed (> COMPLETION_THRESHOLD)
        if (percentageWatched > COMPLETION_THRESHOLD) {
          periodCompletedSessions.set(
            periodKey,
            periodCompletedSessions.get(periodKey) + 1,
          );
          completedSessions++;
        }
        // Check if partial view (between DROPOFF_THRESHOLD and COMPLETION_THRESHOLD)
        else if (
          percentageWatched >= DROPOFF_THRESHOLD &&
          percentageWatched <= COMPLETION_THRESHOLD
        ) {
          periodPartialSessions.set(
            periodKey,
            periodPartialSessions.get(periodKey) + 1,
          );
          partialSessions++;
        }
        // Check if dropped off (< DROPOFF_THRESHOLD)
        else if (percentageWatched < DROPOFF_THRESHOLD) {
          periodDroppedOffSessions.set(
            periodKey,
            periodDroppedOffSessions.get(periodKey) + 1,
          );
          droppedOffSessions++;
        }
      }
    });

    // Format label based on period
    let periodLabel = 'date';
    switch (period) {
      case TimePeriod.WEEKLY:
        periodLabel = 'week';
        break;
      case TimePeriod.MONTHLY:
        periodLabel = 'month';
        break;
    }

    // Calculate rates for each period and convert to array format
    const distribution = Array.from(periodTotalSessions.entries()).map(
      ([periodKey, total]) => {
        const completed = periodCompletedSessions.get(periodKey) || 0;
        const partial = periodPartialSessions.get(periodKey) || 0;
        const droppedOff = periodDroppedOffSessions.get(periodKey) || 0;

        const completionRate =
          total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0;
        const partialRate =
          total > 0 ? Math.round((partial / total) * 100 * 100) / 100 : 0;
        const dropOffRate =
          total > 0 ? Math.round((droppedOff / total) * 100 * 100) / 100 : 0;

        return {
          [periodLabel]: periodKey,
          totalSessions: total,
          completedSessions: completed,
          partialSessions: partial,
          droppedOffSessions: droppedOff,
          completionRate,
          partialRate,
          dropOffRate,
        };
      },
    );

    // Calculate overall rates
    const overallCompletionRate =
      totalSessions > 0
        ? Math.round((completedSessions / totalSessions) * 100 * 100) / 100
        : 0;
    const overallPartialRate =
      totalSessions > 0
        ? Math.round((partialSessions / totalSessions) * 100 * 100) / 100
        : 0;
    const overallDropOffRate =
      totalSessions > 0
        ? Math.round((droppedOffSessions / totalSessions) * 100 * 100) / 100
        : 0;

    const video = await this.videoRepo.findOne({ where: { id: videoId } });

    return successHandler(
      `${period} completion and drop-off rates retrieved for video ${videoId}`,
      {
        videoId,
        title: video?.title || 'Unknown',
        period,
        dateRange: {
          start: queryStartDate,
          end: queryEndDate,
        },
        totalSessions,
        completedSessions,
        partialSessions,
        droppedOffSessions,
        completionRate: overallCompletionRate,
        partialRate: overallPartialRate,
        dropOffRate: overallDropOffRate,
        distribution,
      },
    );
  }
}
