import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import { UserSession } from 'src/entities/user_sessions.entity';
import { User } from 'src/entities/users.entity';
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
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserSession)
    private userSessionRepo: Repository<UserSession>,
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
}
