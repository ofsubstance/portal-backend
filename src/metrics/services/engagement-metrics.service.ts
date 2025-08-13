import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import { Profile } from 'src/entities/user_profiles.entity';
import { UserSession } from 'src/entities/user_sessions.entity';
import { User } from 'src/entities/users.entity';
import { WatchSession } from 'src/entities/watch_sessions.entity';
import { successHandler } from 'src/utils/response.handler';
import { Between, Repository } from 'typeorm';
import { TimeFrameDto } from '../dto/time-frame.dto';
import { DurationSpan } from '../enums/duration-span.enum';
import {
  createPeriodMap,
  getPeriodsInRange,
  processDateParams,
} from '../utils/date-helpers.util';

@Injectable()
export class EngagementMetricsService {
  private readonly logger = new Logger('EngagementMetricsService');

  // Constants for content completion thresholds
  private readonly CONTENT_FINISHED_THRESHOLD = 0.8; // 80%
  private readonly CONTENT_DROPPED_THRESHOLD = 0.5; // 50%

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserSession)
    private userSessionRepo: Repository<UserSession>,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    @InjectRepository(WatchSession)
    private readonly watchSessionRepo: Repository<WatchSession>,
  ) {}

  async getAverageSessionTime(
    timeFrame: TimeFrameDto,
    span: DurationSpan = DurationSpan.DAILY,
  ) {
    // Process the date parameters
    const {
      startPeriodString,
      endPeriodString,
      dateFormat,
      queryStartDate,
      queryEndDate,
    } = processDateParams(
      timeFrame.startDate ? new Date(timeFrame.startDate) : undefined,
      timeFrame.endDate ? new Date(timeFrame.endDate) : undefined,
      span,
    );

    // Get all periods in the range to establish time groups
    const periodRange = getPeriodsInRange(queryStartDate, queryEndDate, span);

    // Initialize period map with zero values
    const periodMap = createPeriodMap(periodRange, dateFormat);
    const sessionCountMap = createPeriodMap(periodRange, dateFormat);

    // Find all completed sessions in the time range
    const sessions = await this.userSessionRepo.find({
      where: {
        startTime: Between(queryStartDate, queryEndDate),
        endTime: Between(queryStartDate, queryEndDate),
        isActive: false, // Only include completed sessions
      },
    });

    if (sessions.length === 0) {
      // No sessions found, return zero values
      // Format data according to timespan
      let periodLabel = 'date';
      switch (span) {
        case DurationSpan.WEEKLY:
          periodLabel = 'week';
          break;
        case DurationSpan.MONTHLY:
          periodLabel = 'month';
          break;
      }

      const data = Array.from(periodMap.entries()).map(([period, _]) => ({
        [periodLabel]: period,
        minutes: 0,
        sessionCount: 0,
      }));

      return successHandler('Average session time retrieved successfully', {
        startDate: startPeriodString,
        endDate: endPeriodString,
        span: span.toLowerCase(),
        data,
        averageSessionTimeMinutes: 0,
        totalSessions: 0,
      });
    }

    // Variables to track overall statistics
    let totalDurationMinutes = 0;
    let totalSessions = 0;

    // Process each session and assign to appropriate period
    sessions.forEach((session) => {
      const sessionStartTime = new Date(session.startTime);
      const sessionEndTime = new Date(session.endTime);

      // Calculate duration in minutes
      const durationMinutes =
        (sessionEndTime.getTime() - sessionStartTime.getTime()) / (1000 * 60);

      // Skip invalid sessions (negative duration or unreasonably long)
      if (durationMinutes <= 0 || durationMinutes > 24 * 60) {
        return;
      }

      // Format the date according to the span
      const periodKey = format(sessionStartTime, dateFormat);

      // Make sure this period is in our range
      if (periodMap.has(periodKey)) {
        // Add to running total for this period
        periodMap.set(periodKey, periodMap.get(periodKey) + durationMinutes);

        // Increment session count for this period
        sessionCountMap.set(periodKey, sessionCountMap.get(periodKey) + 1);

        // Add to overall totals
        totalDurationMinutes += durationMinutes;
        totalSessions++;
      }
    });

    // Calculate average for each period
    periodRange.forEach((date) => {
      const periodKey = format(date, dateFormat);
      const periodTotal = periodMap.get(periodKey) || 0;
      const sessionCount = sessionCountMap.get(periodKey) || 0;

      // Calculate average or set to 0 if no sessions
      const average =
        sessionCount > 0
          ? parseFloat((periodTotal / sessionCount).toFixed(1))
          : 0;

      // Update map with the average
      periodMap.set(periodKey, average);
    });

    // Calculate overall average
    const overallAverage =
      totalSessions > 0
        ? parseFloat((totalDurationMinutes / totalSessions).toFixed(1))
        : 0;

    // Format data according to timespan
    let periodLabel = 'date';
    switch (span) {
      case DurationSpan.WEEKLY:
        periodLabel = 'week';
        break;
      case DurationSpan.MONTHLY:
        periodLabel = 'month';
        break;
    }

    // Convert map to array format
    const data = Array.from(periodMap.entries()).map(([period, minutes]) => ({
      [periodLabel]: period,
      minutes,
      sessionCount: sessionCountMap.get(period) || 0,
    }));

    const spanLabel = span.toLowerCase();

    return successHandler('Average session time retrieved successfully', {
      startDate: startPeriodString,
      endDate: endPeriodString,
      span: spanLabel,
      data,
      averageSessionTimeMinutes: overallAverage,
      totalSessions,
    });
  }

  async getSessionMetrics(startDate: Date, endDate: Date) {
    this.logger.log(
      `Calculating session metrics from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    const query = {
      startTime: Between(startDate, endDate),
      isActive: false, // Only include completed sessions for accurate metrics
    };

    const sessions = await this.userSessionRepo.find({
      where: query,
      select: ['startTime', 'endTime', 'contentEngaged'],
    });

    this.logger.log(
      `Found ${sessions.length} completed sessions in the date range`,
    );

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageDurationMinutes: 0,
        totalDurationMinutes: 0,
        engagedSessions: 0,
        engagementRate: 0,
      };
    }

    // Calculate valid session durations in minutes
    const validSessionDurations = sessions
      .map((session) => {
        // Ensure both timestamps exist
        if (!session.startTime || !session.endTime) {
          return null;
        }

        const start = new Date(session.startTime).getTime();
        const end = new Date(session.endTime).getTime();

        // Calculate duration in minutes
        const durationMinutes = (end - start) / (1000 * 60);

        // Validate duration (must be positive and less than 24 hours)
        if (durationMinutes <= 0 || durationMinutes > 24 * 60) {
          return null;
        }

        return durationMinutes;
      })
      .filter((duration): duration is number => duration !== null);

    // Get count of valid sessions
    const validSessionCount = validSessionDurations.length;

    if (validSessionCount === 0) {
      return {
        totalSessions: sessions.length,
        averageDurationMinutes: 0,
        totalDurationMinutes: 0,
        engagedSessions: 0,
        engagementRate: 0,
      };
    }

    // Calculate total and average duration from valid sessions only
    const totalDurationMinutes = validSessionDurations.reduce(
      (sum, duration) => sum + duration,
      0,
    );
    const averageDurationMinutes = totalDurationMinutes / validSessionCount;

    // Calculate engagement metrics
    const engagedSessions = sessions.filter(
      (session) => session.contentEngaged,
    ).length;
    const engagementRate = (engagedSessions / sessions.length) * 100;

    return {
      totalSessions: sessions.length,
      validSessions: validSessionCount,
      averageDurationMinutes: Math.round(averageDurationMinutes * 100) / 100,
      totalDurationMinutes: Math.round(totalDurationMinutes * 100) / 100,
      engagedSessions,
      engagementRate: Math.round(engagementRate * 100) / 100,
      startDate,
      endDate,
    };
  }

  async getSessionsByTimespan(
    startDate: Date,
    endDate: Date,
    span: DurationSpan = DurationSpan.DAILY,
  ) {
    this.logger.log(
      `Getting ${span} session metrics from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    const {
      startPeriodString,
      endPeriodString,
      dateFormat,
      queryStartDate,
      queryEndDate,
    } = processDateParams(startDate, endDate, span);

    const periodRange = getPeriodsInRange(queryStartDate, queryEndDate, span);
    const periodMap = createPeriodMap(periodRange, dateFormat);
    const engagedSessionsMap = createPeriodMap(periodRange, dateFormat);
    const durationMap = createPeriodMap(periodRange, dateFormat);

    const sessions = await this.userSessionRepo.find({
      where: {
        startTime: Between(queryStartDate, queryEndDate),
        isActive: false,
      },
      select: ['startTime', 'endTime', 'contentEngaged'],
    });

    sessions.forEach((session) => {
      const periodKey = format(new Date(session.startTime), dateFormat);
      if (periodMap.has(periodKey)) {
        // Calculate duration in minutes with validation
        if (session.startTime && session.endTime) {
          const start = new Date(session.startTime).getTime();
          const end = new Date(session.endTime).getTime();
          const durationMinutes = (end - start) / (1000 * 60);

          // Only count valid durations (positive and less than 24 hours)
          if (durationMinutes > 0 && durationMinutes <= 24 * 60) {
            periodMap.set(periodKey, periodMap.get(periodKey) + 1);
            durationMap.set(
              periodKey,
              durationMap.get(periodKey) + durationMinutes,
            );

            if (session.contentEngaged) {
              engagedSessionsMap.set(
                periodKey,
                engagedSessionsMap.get(periodKey) + 1,
              );
            }
          }
        }
      }
    });

    // Format label based on period
    let periodLabel = 'date';
    switch (span) {
      case DurationSpan.WEEKLY:
        periodLabel = 'week';
        break;
      case DurationSpan.MONTHLY:
        periodLabel = 'month';
        break;
    }

    // Convert maps to array format with calculated metrics
    const distribution = Array.from(periodMap.entries()).map(
      ([period, count]) => {
        const engagedCount = engagedSessionsMap.get(period) || 0;
        const totalDurationMinutes = durationMap.get(period) || 0;
        const averageDurationMinutes =
          count > 0 ? totalDurationMinutes / count : 0;

        return {
          [periodLabel]: period,
          sessions: count,
          engagedSessions: engagedCount,
          engagementRate:
            count > 0
              ? Math.round((engagedCount / count) * 100 * 100) / 100
              : 0,
          averageDurationMinutes:
            Math.round(averageDurationMinutes * 100) / 100,
          totalDurationMinutes: Math.round(totalDurationMinutes * 100) / 100,
        };
      },
    );

    return successHandler(`${span} session metrics retrieved successfully`, {
      startDate: startPeriodString,
      endDate: endPeriodString,
      span: span.toLowerCase(),
      data: distribution,
    });
  }

  async getDailySessions(startDate: Date, endDate: Date) {
    return this.getSessionsByTimespan(startDate, endDate, DurationSpan.DAILY);
  }

  async getUtilizationDistribution() {
    const utilizationStats = await this.profileRepo
      .createQueryBuilder('profile')
      .select('profile.utilization_purpose', 'purpose')
      .addSelect('COUNT(*)', 'count')
      .groupBy('profile.utilization_purpose')
      .getRawMany();

    const totalUsers = utilizationStats.reduce(
      (sum, stat) => sum + parseInt(stat.count),
      0,
    );

    const data = utilizationStats.map((stat) => ({
      purpose: stat.purpose,
      count: parseInt(stat.count),
      percentage:
        Math.round((parseInt(stat.count) / totalUsers) * 100 * 100) / 100,
    }));

    return successHandler(
      'User utilization purpose distribution retrieved successfully',
      {
        totalUsers,
        data,
      },
    );
  }

  async getInterestsDistribution() {
    const interestsStats = await this.profileRepo
      .createQueryBuilder('profile')
      .select('UNNEST(profile.interests)', 'interest')
      .addSelect('COUNT(*)', 'count')
      .groupBy('UNNEST(profile.interests)')
      .getRawMany();

    const totalProfiles = await this.profileRepo.count();

    const data = interestsStats.map((stat) => ({
      interest: stat.interest,
      count: parseInt(stat.count),
    }));

    data.sort((a, b) => b.count - a.count);

    return successHandler(
      'User interests distribution retrieved successfully',
      {
        totalUsers: totalProfiles,
        data,
      },
    );
  }

  async getInterestsOverlap() {
    // Get total profiles count first for percentage calculation
    const totalProfiles = await this.profileRepo.count();

    // Get profiles with their interests
    const profilesWithInterests = await this.profileRepo.find({
      select: ['interests'],
    });

    // Create a map to track interest pair counts
    const interestPairCounts = new Map();

    // Process each profile
    profilesWithInterests.forEach((profile) => {
      const interests = profile.interests || [];

      // Only process if profile has at least 2 interests
      if (interests.length < 2) return;

      // Create unique pairs and count them
      for (let i = 0; i < interests.length; i++) {
        for (let j = i + 1; j < interests.length; j++) {
          // Ensure consistent ordering of interests in pair
          const [interest1, interest2] = [interests[i], interests[j]].sort();
          const pairKey = `${interest1}__${interest2}`;

          if (!interestPairCounts.has(pairKey)) {
            interestPairCounts.set(pairKey, {
              interest1,
              interest2,
              count: 0,
            });
          }

          interestPairCounts.get(pairKey).count += 1;
        }
      }
    });

    // Convert to array and sort by count
    let results = Array.from(interestPairCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Get top 20

    // Format the data
    const data = results.map((item) => ({
      combination: [item.interest1, item.interest2],
      count: item.count,
    }));

    return successHandler(
      'User interests overlap analysis retrieved successfully',
      {
        totalUsers: totalProfiles,
        data,
      },
    );
  }

  async getContentWatchRates(startDate: Date, endDate: Date) {
    this.logger.log(
      `Calculating content watch rates from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    // Fetch more detailed data for enhanced analytics
    const sessions = await this.watchSessionRepo.find({
      where: {
        startTime: Between(startDate, endDate),
      },
      select: [
        'percentageWatched',
        'actualTimeWatched',
        'startTime',
        'endTime',
        'videoId',
        'userEvent',
        'userSessionId',
      ],
      relations: ['video'],
    });

    if (sessions.length === 0) {
      return successHandler('Content watch rates retrieved successfully', {
        averageWatchRate: 0,
        finishRate: 0,
        dropRate: 0,
        totalSessions: 0,
        averageTimeWatched: 0,
        totalTimeWatched: 0,
        totalUniqueVideos: 0,
        totalUniqueSessions: 0,
        startDate,
        endDate,
      });
    }

    // Calculate watch rates for each session
    const watchRates = sessions.map((session) => ({
      watchRate: session.percentageWatched,
      timeWatched: session.actualTimeWatched,
      isFinished:
        session.percentageWatched >= this.CONTENT_FINISHED_THRESHOLD * 100,
      isDropped:
        session.percentageWatched < this.CONTENT_DROPPED_THRESHOLD * 100,
      videoId: session.videoId,
      userSessionId: session.userSessionId,
      // Calculate session duration if available
      sessionDuration:
        session.endTime && session.startTime
          ? (new Date(session.endTime).getTime() -
              new Date(session.startTime).getTime()) /
            1000
          : null,
      // Count interactions if available
      interactions: session.userEvent?.length || 0,
    }));

    // Calculate average watch rate
    const averageWatchRate =
      watchRates.reduce((sum, session) => sum + session.watchRate, 0) /
      sessions.length;

    // Calculate finish and drop rates
    const finishedSessions = watchRates.filter(
      (session) => session.isFinished,
    ).length;
    const droppedSessions = watchRates.filter(
      (session) => session.isDropped,
    ).length;

    const finishRate = (finishedSessions / sessions.length) * 100;
    const dropRate = (droppedSessions / sessions.length) * 100;

    // Calculate time-based metrics
    const totalTimeWatched = watchRates.reduce(
      (sum, session) => sum + session.timeWatched,
      0,
    );
    const averageTimeWatched = totalTimeWatched / sessions.length;

    // Count unique videos and user sessions
    const uniqueVideos = new Set(watchRates.map((s) => s.videoId));
    const uniqueSessions = new Set(watchRates.map((s) => s.userSessionId));

    // Calculate engagement metrics
    const interactiveSessionsCount = watchRates.filter(
      (s) => s.interactions > 0,
    ).length;
    const interactionRate = (interactiveSessionsCount / sessions.length) * 100;

    // Analyze completion by video length (if we have duration data)
    const completionByLength = {
      short: { total: 0, completed: 0, rate: 0 }, // < 5 min
      medium: { total: 0, completed: 0, rate: 0 }, // 5-15 min
      long: { total: 0, completed: 0, rate: 0 }, // > 15 min
    };

    // Additional analysis could be performed here

    return successHandler('Content watch rates retrieved successfully', {
      averageWatchRate: Math.round(averageWatchRate * 100) / 100,
      finishRate: Math.round(finishRate * 100) / 100,
      dropRate: Math.round(dropRate * 100) / 100,
      totalSessions: sessions.length,
      // Enhanced metrics
      averageTimeWatched: Math.round(averageTimeWatched * 100) / 100,
      totalTimeWatched: Math.round(totalTimeWatched * 100) / 100,
      totalUniqueVideos: uniqueVideos.size,
      totalUniqueSessions: uniqueSessions.size,
      interactionRate: Math.round(interactionRate * 100) / 100,
      startDate,
      endDate,
    });
  }

  async getContentWatchRatesByTimespan(
    startDate: Date,
    endDate: Date,
    span: DurationSpan = DurationSpan.DAILY,
  ) {
    this.logger.log(
      `Getting ${span} content watch rates from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    const {
      startPeriodString,
      endPeriodString,
      dateFormat,
      queryStartDate,
      queryEndDate,
    } = processDateParams(startDate, endDate, span);

    const periodRange = getPeriodsInRange(queryStartDate, queryEndDate, span);

    // Initialize maps for each metric
    const watchRateMap = createPeriodMap(periodRange, dateFormat);
    const finishRateMap = createPeriodMap(periodRange, dateFormat);
    const dropRateMap = createPeriodMap(periodRange, dateFormat);
    const sessionCountMap = createPeriodMap(periodRange, dateFormat);
    const timeWatchedMap = createPeriodMap(periodRange, dateFormat);
    const interactionCountMap = createPeriodMap(periodRange, dateFormat);
    const uniqueVideosMap = new Map(
      Array.from(periodRange).map((date) => [
        format(date, dateFormat),
        new Set<string>(),
      ]),
    );
    const uniqueSessionsMap = new Map(
      Array.from(periodRange).map((date) => [
        format(date, dateFormat),
        new Set<string>(),
      ]),
    );

    // Get more detailed session data
    const sessions = await this.watchSessionRepo.find({
      where: {
        startTime: Between(queryStartDate, queryEndDate),
      },
      select: [
        'startTime',
        'percentageWatched',
        'actualTimeWatched',
        'videoId',
        'userSessionId',
        'userEvent',
      ],
    });

    // Group sessions by period
    sessions.forEach((session) => {
      const periodKey = format(new Date(session.startTime), dateFormat);
      if (watchRateMap.has(periodKey)) {
        const watchRate = session.percentageWatched;
        const isFinished = watchRate >= this.CONTENT_FINISHED_THRESHOLD * 100;
        const isDropped = watchRate < this.CONTENT_DROPPED_THRESHOLD * 100;
        const interactions = session.userEvent?.length || 0;

        // Update running totals
        watchRateMap.set(periodKey, watchRateMap.get(periodKey) + watchRate);
        timeWatchedMap.set(
          periodKey,
          timeWatchedMap.get(periodKey) + session.actualTimeWatched,
        );
        interactionCountMap.set(
          periodKey,
          interactionCountMap.get(periodKey) + interactions,
        );

        if (isFinished) {
          finishRateMap.set(periodKey, finishRateMap.get(periodKey) + 1);
        }
        if (isDropped) {
          dropRateMap.set(periodKey, dropRateMap.get(periodKey) + 1);
        }
        sessionCountMap.set(periodKey, sessionCountMap.get(periodKey) + 1);

        // Track unique videos and sessions
        if (session.videoId) {
          uniqueVideosMap.get(periodKey).add(session.videoId);
        }
        if (session.userSessionId) {
          uniqueSessionsMap.get(periodKey).add(session.userSessionId);
        }
      }
    });

    // Calculate averages for each period
    let periodLabel = 'date';
    switch (span) {
      case DurationSpan.WEEKLY:
        periodLabel = 'week';
        break;
      case DurationSpan.MONTHLY:
        periodLabel = 'month';
        break;
    }

    const data = Array.from(watchRateMap.entries()).map(
      ([period, totalWatchRate]) => {
        const sessionCount = sessionCountMap.get(period) || 0;
        const averageWatchRate =
          sessionCount > 0 ? totalWatchRate / sessionCount : 0;
        const finishRate =
          sessionCount > 0
            ? (finishRateMap.get(period) / sessionCount) * 100
            : 0;
        const dropRate =
          sessionCount > 0 ? (dropRateMap.get(period) / sessionCount) * 100 : 0;

        // Calculate enhanced metrics
        const totalTimeWatched = timeWatchedMap.get(period) || 0;
        const averageTimeWatched =
          sessionCount > 0 ? totalTimeWatched / sessionCount : 0;
        const uniqueVideosCount = uniqueVideosMap.get(period)?.size || 0;
        const uniqueSessionsCount = uniqueSessionsMap.get(period)?.size || 0;
        const totalInteractions = interactionCountMap.get(period) || 0;
        const interactionsPerSession =
          sessionCount > 0 ? totalInteractions / sessionCount : 0;

        return {
          period,
          [periodLabel]: period,
          averageWatchRate: Math.round(averageWatchRate * 100) / 100,
          finishRate: Math.round(finishRate * 100) / 100,
          dropRate: Math.round(dropRate * 100) / 100,
          sessionCount,
          // Enhanced metrics
          totalTimeWatched: Math.round(totalTimeWatched * 100) / 100,
          averageTimeWatched: Math.round(averageTimeWatched * 100) / 100,
          uniqueVideosCount,
          uniqueSessionsCount,
          totalInteractions,
          interactionsPerSession:
            Math.round(interactionsPerSession * 100) / 100,
        };
      },
    );

    return successHandler(
      'Content watch rates by timespan retrieved successfully',
      {
        startDate: startPeriodString,
        endDate: endPeriodString,
        span: span.toLowerCase(),
        data,
      },
    );
  }

  async getInterestCoOccurrenceMatrix() {
    // Get all unique interests first
    const allInterestsResult = await this.profileRepo
      .createQueryBuilder('profile')
      .select('DISTINCT UNNEST(profile.interests)', 'interest')
      .getRawMany();

    const allInterests = allInterestsResult.map((r) => r.interest).sort();

    // Get profiles with their interests
    const profilesWithInterests = await this.profileRepo.find({
      select: ['interests'],
    });

    // Define interest data type with proper structure
    interface InterestData {
      interest: string;
      userCount: number;
      coOccurrence: Record<string, number>;
    }

    // Initialize co-occurrence matrix
    const matrix = {
      interests: allInterests,
      counts: allInterests.map(
        (interest) =>
          ({
            interest,
            userCount: 0,
            coOccurrence: Object.fromEntries(
              allInterests.map((otherInterest) => [otherInterest, 0]),
            ),
          }) as InterestData,
      ),
    };

    // Build the matrix
    profilesWithInterests.forEach((profile) => {
      const interests = profile.interests || [];

      // Count individual interests
      interests.forEach((interest) => {
        const interestObj = matrix.counts.find((i) => i.interest === interest);
        if (interestObj) {
          interestObj.userCount++;

          // Count co-occurrences
          interests.forEach((otherInterest) => {
            interestObj.coOccurrence[otherInterest]++;
          });
        }
      });
    });

    // Calculate total users
    const totalUsers = await this.profileRepo.count();

    return successHandler(
      'Interest co-occurrence matrix retrieved successfully',
      {
        totalUsers,
        matrix,
        // Add histogram data for simple pie chart
        distributionData: matrix.counts
          .map((item) => ({
            interest: item.interest,
            count: item.userCount,
          }))
          .sort((a, b) => b.count - a.count),
      },
    );
  }

  async getInterestOverlapForSankey() {
    // Get all profiles with interests
    const profilesWithInterests = await this.profileRepo.find({
      select: ['id', 'interests'],
    });

    // Get all unique interests first
    const uniqueInterests = new Set<string>();
    profilesWithInterests.forEach((profile) => {
      (profile.interests || []).forEach((interest) => {
        uniqueInterests.add(interest);
      });
    });

    // Create nodes array for Sankey diagram
    const nodes = Array.from(uniqueInterests).map((interest) => ({
      id: interest,
      name: interest,
    }));

    // Track interest connections
    interface InterestLink {
      source: string;
      target: string;
      value: number;
    }

    const linkMap = new Map<string, InterestLink>();

    // Process each profile to build links
    profilesWithInterests.forEach((profile) => {
      const interests = profile.interests || [];

      // Only process if profile has at least 2 interests
      if (interests.length < 2) return;

      // Create links between every pair of interests
      for (let i = 0; i < interests.length; i++) {
        for (let j = i + 1; j < interests.length; j++) {
          // For Sankey diagrams, direction matters
          // We'll use alphabetical order for consistent direction
          const [source, target] = [interests[i], interests[j]].sort();

          const linkKey = `${source}|${target}`;

          if (!linkMap.has(linkKey)) {
            linkMap.set(linkKey, {
              source,
              target,
              value: 0,
            });
          }

          // Increment value (width of the flow)
          linkMap.get(linkKey).value += 1;
        }
      }
    });

    // Convert links to array and filter out links with low values
    const links = Array.from(linkMap.values())
      .filter((link) => link.value > 0) // Only include links with values
      .sort((a, b) => b.value - a.value); // Sort by strength

    return successHandler(
      'Interest overlap data for Sankey diagram retrieved successfully',
      {
        totalUsers: profilesWithInterests.length,
        // Format the data suitable for Sankey diagrams
        sankeyData: {
          nodes,
          links,
        },
        // Include node frequencies for sizing nodes
        nodeFrequencies: nodes
          .map((node) => {
            const count = profilesWithInterests.filter((profile) =>
              (profile.interests || []).includes(node.id),
            ).length;

            return {
              id: node.id,
              count,
            };
          })
          .sort((a, b) => b.count - a.count),
      },
    );
  }
}
