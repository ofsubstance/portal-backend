import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Between, Repository } from 'typeorm';
import { UserSession } from '../../entities/user_sessions.entity';
import { DurationSpan } from '../enums/duration-span.enum';

@Injectable()
export class SessionMetricsService {
  private readonly logger = new Logger('SessionMetricsService');

  constructor(
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
  ) {}

  async getSessionMetrics(startDate: Date, endDate: Date) {
    this.logger.log(
      `Calculating session metrics from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    const query: any = {
      startTime: Between(startDate, endDate),
      isActive: false, // Only include completed sessions for accurate metrics
    };

    const sessions = await this.userSessionRepository.find({
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

    // Calculate session durations in minutes
    const sessionDurations = sessions.map((session) => {
      const start = new Date(session.startTime).getTime();
      const end = new Date(session.endTime).getTime();
      return (end - start) / (1000 * 60); // Convert ms to minutes
    });

    // Calculate total and average duration
    const totalDurationMinutes = sessionDurations.reduce(
      (sum, duration) => sum + duration,
      0,
    );
    const averageDurationMinutes = totalDurationMinutes / sessions.length;

    // Calculate engagement metrics
    const engagedSessions = sessions.filter(
      (session) => session.contentEngaged,
    ).length;
    const engagementRate = (engagedSessions / sessions.length) * 100;

    const metrics = {
      totalSessions: sessions.length,
      averageDurationMinutes,
      totalDurationMinutes,
      engagedSessions,
      engagementRate,
      startDate,
      endDate,
    };

    this.logger.log(
      `Metrics calculated: Avg. duration: ${averageDurationMinutes.toFixed(2)} mins, Engagement rate: ${engagementRate.toFixed(2)}%`,
    );

    return metrics;
  }

  async getSessionsByTimespan(
    startDate: Date,
    endDate: Date,
    span: DurationSpan = DurationSpan.DAILY,
  ) {
    this.logger.log(
      `Getting ${span} session metrics from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    // Adjust dates based on span to ensure we have complete periods
    let adjustedStartDate: Date;
    let adjustedEndDate: Date;

    switch (span) {
      case DurationSpan.WEEKLY:
        adjustedStartDate = startOfWeek(startDate);
        adjustedEndDate = endOfWeek(endDate);
        break;
      case DurationSpan.MONTHLY:
        adjustedStartDate = startOfMonth(startDate);
        adjustedEndDate = endOfMonth(endDate);
        break;
      case DurationSpan.DAILY:
      default:
        adjustedStartDate = startOfDay(startDate);
        adjustedEndDate = endOfDay(endDate);
        break;
    }

    const query = {
      startTime: Between(adjustedStartDate, adjustedEndDate),
    };

    // Fetch all sessions in the date range
    const sessions = await this.userSessionRepository.find({
      where: query,
      select: ['startTime', 'endTime', 'contentEngaged'],
    });

    this.logger.log(`Found ${sessions.length} sessions in the date range`);

    // Group sessions by the appropriate time period
    const groupedSessions = {};
    const groupedEngagements = {};

    // Initialize the periods in the range
    let currentPeriodStart = new Date(adjustedStartDate);
    const formatPattern = this.getFormatPattern(span);

    while (currentPeriodStart <= adjustedEndDate) {
      let nextPeriodStart: Date;

      switch (span) {
        case DurationSpan.WEEKLY:
          nextPeriodStart = addWeeks(currentPeriodStart, 1);
          break;
        case DurationSpan.MONTHLY:
          nextPeriodStart = addMonths(currentPeriodStart, 1);
          break;
        case DurationSpan.DAILY:
        default:
          nextPeriodStart = addDays(currentPeriodStart, 1);
          break;
      }

      const periodKey = format(currentPeriodStart, formatPattern);
      groupedSessions[periodKey] = 0;
      groupedEngagements[periodKey] = 0;

      currentPeriodStart = nextPeriodStart;
    }

    // Count sessions by period
    sessions.forEach((session) => {
      const sessionDate = new Date(session.startTime);
      const periodKey = format(sessionDate, formatPattern);

      if (groupedSessions[periodKey] !== undefined) {
        groupedSessions[periodKey]++;

        if (session.contentEngaged) {
          groupedEngagements[periodKey]++;
        }
      }
    });

    // Convert to array format for easier consumption
    const result = Object.keys(groupedSessions).map((period) => {
      const periodData = {
        period,
        sessions: groupedSessions[period],
        engagedSessions: groupedEngagements[period],
        engagementRate: groupedSessions[period]
          ? (groupedEngagements[period] / groupedSessions[period]) * 100
          : 0,
      };

      // Add specific period field name based on span
      switch (span) {
        case DurationSpan.WEEKLY:
          periodData['week'] = period;
          break;
        case DurationSpan.MONTHLY:
          periodData['month'] = period;
          break;
        case DurationSpan.DAILY:
        default:
          periodData['date'] = period;
          break;
      }

      return periodData;
    });

    return result;
  }

  private getFormatPattern(span: DurationSpan): string {
    switch (span) {
      case DurationSpan.WEEKLY:
        return 'yyyy-MM-ww'; // Year-Month-WeekNumber
      case DurationSpan.MONTHLY:
        return 'yyyy-MM'; // Year-Month
      case DurationSpan.DAILY:
      default:
        return 'yyyy-MM-dd'; // Year-Month-Day
    }
  }

  async getDailySessions(startDate: Date, endDate: Date) {
    return this.getSessionsByTimespan(startDate, endDate, DurationSpan.DAILY);
  }
}
