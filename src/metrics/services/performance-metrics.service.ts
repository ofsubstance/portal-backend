import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  endOfDay,
  endOfMonth,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import { LoginEvent } from 'src/entities/login_events.entity';
import { User } from 'src/entities/users.entity';
import { successHandler } from 'src/utils/response.handler';
import { Repository } from 'typeorm';
import { DurationSpan } from '../enums/duration-span.enum';
import {
  createPeriodMap,
  getDefaultStartDate,
  getMonthDifference,
  getPeriodsInRange,
  processDateParams,
} from '../utils/date-helpers.util';

@Injectable()
export class PerformanceMetricsService {
  constructor(
    @InjectRepository(LoginEvent)
    private loginEventRepo: Repository<LoginEvent>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getDailyActiveUsers(date: Date = new Date()) {
    // Ensure we're working with the exact date from the request
    const dateString = date.toISOString().split('T')[0];
    const startDate = startOfDay(parseISO(dateString));
    const endDate = endOfDay(parseISO(dateString));

    const uniqueUsers = await this.loginEventRepo
      .createQueryBuilder('login_event')
      .select('COUNT(DISTINCT "userId")', 'count')
      .where('login_event.timestamp >= :startDate', { startDate })
      .andWhere('login_event.timestamp <= :endDate', { endDate })
      .andWhere('login_event.successful = :successful', { successful: true })
      .getRawOne();

    return successHandler('Daily active users retrieved successfully', {
      date: dateString,
      count: parseInt(uniqueUsers.count),
    });
  }

  async getMonthlyActiveUsers(date: Date = new Date()) {
    // Ensure we're working with the exact month from the request
    const monthString = date.toISOString().split('T')[0].substring(0, 7);
    const startDate = startOfMonth(parseISO(`${monthString}-01`));
    const endDate = endOfMonth(parseISO(`${monthString}-01`));

    const uniqueUsers = await this.loginEventRepo
      .createQueryBuilder('login_event')
      .select('COUNT(DISTINCT "userId")', 'count')
      .where('login_event.timestamp >= :startDate', { startDate })
      .andWhere('login_event.timestamp <= :endDate', { endDate })
      .andWhere('login_event.successful = :successful', { successful: true })
      .getRawOne();

    return successHandler('Monthly active users retrieved successfully', {
      month: monthString,
      count: parseInt(uniqueUsers.count),
    });
  }

  async getDauTrend(startDate?: Date, endDate?: Date) {
    // Ensure we're working with exact dates from the request
    const startDateString =
      startDate?.toISOString().split('T')[0] ||
      format(getDefaultStartDate(DurationSpan.DAILY), 'yyyy-MM-dd');
    const endDateString =
      endDate?.toISOString().split('T')[0] || format(new Date(), 'yyyy-MM-dd');

    const queryStartDate = startOfDay(parseISO(startDateString));
    const queryEndDate = endOfDay(parseISO(endDateString));

    // Get all dates in the range
    const dateRange = getPeriodsInRange(
      queryStartDate,
      queryEndDate,
      DurationSpan.DAILY,
    );

    // Initialize all dates with zero counts
    const dateMap = createPeriodMap(dateRange, 'yyyy-MM-dd');

    const dailyUsers = await this.loginEventRepo
      .createQueryBuilder('login_event')
      .select('DATE(login_event.timestamp)', 'date')
      .addSelect('COUNT(DISTINCT "userId")', 'count')
      .where('login_event.timestamp >= :startDate', {
        startDate: queryStartDate,
      })
      .andWhere('login_event.timestamp <= :endDate', { endDate: queryEndDate })
      .andWhere('login_event.successful = :successful', { successful: true })
      .groupBy('DATE(login_event.timestamp)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Update map with actual counts
    dailyUsers.forEach((day) => {
      const dateStr = day.date.split('T')[0]; // Handle both date string and ISO format
      if (dateMap.has(dateStr)) {
        dateMap.set(dateStr, parseInt(day.count));
      }
    });

    // Convert map to array format
    const data = Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    return successHandler('Daily active users trend retrieved successfully', {
      startDate: startDateString,
      endDate: endDateString,
      data,
    });
  }

  async getMauTrend(startDate?: Date, endDate?: Date) {
    // Process the date parameters
    const {
      startPeriodString: startMonthString,
      endPeriodString: endMonthString,
      queryStartDate,
      queryEndDate,
    } = processDateParams(startDate, endDate, DurationSpan.MONTHLY);

    // Get all months in the range
    const monthRange = getPeriodsInRange(
      queryStartDate,
      queryEndDate,
      DurationSpan.MONTHLY,
    );

    // Initialize all months with zero counts
    const monthMap = createPeriodMap(monthRange, 'yyyy-MM');

    const monthlyUsers = await this.loginEventRepo
      .createQueryBuilder('login_event')
      .select("TO_CHAR(login_event.timestamp, 'YYYY-MM')", 'month')
      .addSelect('COUNT(DISTINCT "userId")', 'count')
      .where('login_event.timestamp >= :startDate', {
        startDate: queryStartDate,
      })
      .andWhere('login_event.timestamp <= :endDate', { endDate: queryEndDate })
      .andWhere('login_event.successful = :successful', { successful: true })
      .groupBy("TO_CHAR(login_event.timestamp, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    // Update map with actual counts
    monthlyUsers.forEach((month) => {
      if (monthMap.has(month.month)) {
        monthMap.set(month.month, parseInt(month.count));
      }
    });

    // Convert map to array format
    const data = Array.from(monthMap.entries()).map(([month, count]) => ({
      month,
      count,
    }));

    return successHandler('Monthly active users trend retrieved successfully', {
      startDate: startMonthString,
      endDate: endMonthString,
      data,
    });
  }

  async getMonthlyGrowthRate(startDate?: Date, endDate?: Date) {
    // Process the date parameters
    const {
      startPeriodString: startMonthString,
      endPeriodString: endMonthString,
      queryStartDate,
      queryEndDate,
    } = processDateParams(startDate, endDate, DurationSpan.MONTHLY, true);

    // Get all months in the range
    const monthRange = getPeriodsInRange(
      queryStartDate,
      queryEndDate,
      DurationSpan.MONTHLY,
    );

    // Initialize all months with zero counts
    const monthMap = createPeriodMap(monthRange, 'yyyy-MM');

    const monthlyUsers = await this.loginEventRepo
      .createQueryBuilder('login_event')
      .select("TO_CHAR(login_event.timestamp, 'YYYY-MM')", 'month')
      .addSelect('COUNT(DISTINCT "userId")', 'count')
      .where('login_event.timestamp >= :startDate', {
        startDate: queryStartDate,
      })
      .andWhere('login_event.timestamp <= :endDate', { endDate: queryEndDate })
      .andWhere('login_event.successful = :successful', { successful: true })
      .groupBy("TO_CHAR(login_event.timestamp, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    // Update map with actual counts
    monthlyUsers.forEach((month) => {
      if (monthMap.has(month.month)) {
        monthMap.set(month.month, parseInt(month.count));
      }
    });

    // Convert map to array and calculate growth rates
    const months = Array.from(monthMap.keys()).sort();
    const growthData = months.map((month, index) => {
      const currentCount = monthMap.get(month);
      const previousCount =
        index > 0 ? monthMap.get(months[index - 1]) : currentCount;

      // Calculate growth rate with better handling for zero previous counts
      let growthRate = 0;
      if (previousCount === 0) {
        // If previous is zero but current has users, represent as "new users" with 100% growth
        growthRate = currentCount > 0 ? 100 : 0;
      } else {
        // Normal calculation when previous count is not zero
        growthRate = ((currentCount - previousCount) / previousCount) * 100;
      }

      return {
        month,
        userCount: currentCount,
        growthRate: Math.round(growthRate * 100) / 100, // Round to 2 decimal places
        previousMonthCount: previousCount,
      };
    });

    return successHandler(
      'Monthly user growth rate trend retrieved successfully',
      {
        startDate: startMonthString,
        endDate: endMonthString,
        data: growthData,
      },
    );
  }

  async getUserRetentionRate(startDate?: Date, endDate?: Date) {
    // Process the date parameters
    const {
      startPeriodString: startMonthString,
      endPeriodString: endMonthString,
      queryStartDate,
      queryEndDate,
    } = processDateParams(startDate, endDate, DurationSpan.MONTHLY);

    // Get all months in the range for creating cohorts
    const monthRange = getPeriodsInRange(
      queryStartDate,
      queryEndDate,
      DurationSpan.MONTHLY,
    );

    // Format months for consistent comparison
    const monthsInRange = monthRange.map((date) => format(date, 'yyyy-MM'));

    // Use a single optimized query to get all first login months (cohorts)
    const cohorts = await this.loginEventRepo
      .createQueryBuilder('login_event')
      .select('login_event.userId', 'userId')
      .addSelect(
        `TO_CHAR(MIN(login_event.timestamp), 'YYYY-MM')`,
        'firstLoginMonth',
      )
      .where('login_event.timestamp >= :startDate', {
        startDate: queryStartDate,
      })
      .andWhere('login_event.timestamp <= :endDate', { endDate: queryEndDate })
      .andWhere('login_event.successful = :successful', { successful: true })
      .groupBy('login_event.userId')
      .getRawMany();

    if (cohorts.length === 0) {
      return successHandler('User retention rates retrieved successfully', {
        startDate: startMonthString,
        endDate: endMonthString,
        totalMonths: monthsInRange.length,
        cohorts: 0,
        data: [],
      });
    }

    // Group users by their cohort month
    const usersByCohort = new Map<string, string[]>();
    cohorts.forEach((cohort) => {
      if (!usersByCohort.has(cohort.firstLoginMonth)) {
        usersByCohort.set(cohort.firstLoginMonth, []);
      }
      usersByCohort.get(cohort.firstLoginMonth).push(cohort.userId);
    });

    // Initialize cohort data structure
    const retentionData = new Map<
      string,
      {
        totalUsers: number;
        returningUsers: Map<number, number>; // monthsAfterCohort -> count
        returningRates: Map<number, number>; // monthsAfterCohort -> percentage
        averageRetentionRate: number;
      }
    >();

    // For each cohort, calculate retention
    for (const [cohortMonth, userIds] of usersByCohort.entries()) {
      // Initialize retention data for this cohort
      retentionData.set(cohortMonth, {
        totalUsers: userIds.length,
        returningUsers: new Map(),
        returningRates: new Map(),
        averageRetentionRate: 0,
      });

      // Calculate max months we can track for this cohort
      const cohortStartDate = new Date(`${cohortMonth}-01`);
      const maxMonths = getMonthDifference(
        cohortStartDate,
        new Date(`${endMonthString}-01`),
      );

      // For each subsequent month, get returning users
      for (let monthDiff = 1; monthDiff <= maxMonths; monthDiff++) {
        const targetMonthDate = new Date(cohortStartDate);
        targetMonthDate.setMonth(targetMonthDate.getMonth() + monthDiff);
        const targetMonth = format(targetMonthDate, 'yyyy-MM');

        // Get returning users for this month
        const returningUsersCount = await this.loginEventRepo
          .createQueryBuilder('login_event')
          .select('COUNT(DISTINCT login_event.userId)', 'count')
          .where('login_event.userId IN (:...userIds)', { userIds })
          .andWhere(
            `TO_CHAR(login_event.timestamp, 'YYYY-MM') = :targetMonth`,
            { targetMonth },
          )
          .andWhere('login_event.successful = :successful', {
            successful: true,
          })
          .getRawOne();

        const count = parseInt(returningUsersCount.count);
        const rate = Math.round((count / userIds.length) * 100);

        retentionData.get(cohortMonth).returningUsers.set(monthDiff, count);
        retentionData.get(cohortMonth).returningRates.set(monthDiff, rate);
      }

      // Calculate average retention rate across all subsequent months
      const cohortData = retentionData.get(cohortMonth);
      if (cohortData.returningRates.size > 0) {
        const totalRate = Array.from(cohortData.returningRates.values()).reduce(
          (sum, rate) => sum + rate,
          0,
        );
        cohortData.averageRetentionRate = Math.round(
          totalRate / cohortData.returningRates.size,
        );
      }
    }

    // Format the retention data for response
    const formattedData = Array.from(retentionData.entries()).map(
      ([cohortMonth, data]) => {
        const retentionRates = {};
        const retentionCounts = {};

        // Add month 0 (the cohort month itself)
        retentionRates['month0'] = 100; // All users are present in their cohort month
        retentionCounts['month0Count'] = data.totalUsers;

        // Add all subsequent months
        for (const [monthDiff, rate] of data.returningRates.entries()) {
          retentionRates[`month${monthDiff}`] = rate;
          retentionCounts[`month${monthDiff}Count`] =
            data.returningUsers.get(monthDiff);
        }

        return {
          cohort: cohortMonth,
          totalUsers: data.totalUsers,
          averageRetentionRate: data.averageRetentionRate,
          ...retentionRates,
          ...retentionCounts,
        };
      },
    );

    // Calculate global retention metrics
    const globalRetention = {
      totalUsers: formattedData.reduce(
        (sum, cohort) => sum + cohort.totalUsers,
        0,
      ),
      averageRetentionByMonth: new Map<number, number>(),
    };

    // Calculate average retention rate for each month across all cohorts
    const monthsWithData = new Set<number>();
    formattedData.forEach((cohort) => {
      Object.keys(cohort)
        .filter(
          (key) =>
            key.startsWith('month') &&
            !key.endsWith('Count') &&
            key !== 'month0',
        )
        .forEach((key) => {
          const monthNum = parseInt(key.replace('month', ''));
          monthsWithData.add(monthNum);
        });
    });

    monthsWithData.forEach((month) => {
      const cohortsWithThisMonth = formattedData.filter((cohort) =>
        Object.prototype.hasOwnProperty.call(cohort, `month${month}`),
      );

      if (cohortsWithThisMonth.length > 0) {
        const totalRate = cohortsWithThisMonth.reduce(
          (sum, cohort) => sum + cohort[`month${month}`],
          0,
        );
        globalRetention.averageRetentionByMonth.set(
          month,
          Math.round(totalRate / cohortsWithThisMonth.length),
        );
      }
    });

    // Convert to response format
    const globalStats = {
      totalCohorts: formattedData.length,
      totalUsers: globalRetention.totalUsers,
      averageRetentionByMonth: Object.fromEntries(
        Array.from(globalRetention.averageRetentionByMonth.entries()).map(
          ([month, rate]) => [`month${month}`, rate],
        ),
      ),
      overallAverageRetention:
        formattedData.length > 0
          ? Math.round(
              formattedData.reduce(
                (sum, cohort) => sum + cohort.averageRetentionRate,
                0,
              ) / formattedData.length,
            )
          : 0,
    };

    return successHandler('User retention rates retrieved successfully', {
      startDate: startMonthString,
      endDate: endMonthString,
      totalMonths: monthsInRange.length,
      cohorts: formattedData.length,
      globalStats,
      data: formattedData,
    });
  }

  async getActiveUsersTrend(
    startDate?: Date,
    endDate?: Date,
    span: DurationSpan = DurationSpan.DAILY,
  ) {
    // Process the date parameters
    const {
      startPeriodString,
      endPeriodString,
      dateFormat,
      queryStartDate,
      queryEndDate,
    } = processDateParams(startDate, endDate, span);

    // Define SQL format based on span type
    let sqlFormatPattern: string;
    let periodLabel: string;

    switch (span) {
      case DurationSpan.WEEKLY:
        sqlFormatPattern = 'YYYY-IW';
        periodLabel = 'week';
        break;
      case DurationSpan.MONTHLY:
        sqlFormatPattern = 'YYYY-MM';
        periodLabel = 'month';
        break;
      default:
        sqlFormatPattern = 'YYYY-MM-DD';
        periodLabel = 'date';
    }

    // Use a single optimized query for all span types
    const activeUsers = await this.loginEventRepo
      .createQueryBuilder('login_event')
      .select(
        `TO_CHAR("login_event"."timestamp", '${sqlFormatPattern}')`,
        'period',
      )
      .addSelect('COUNT(DISTINCT "login_event"."userId")', 'count')
      .where('login_event.timestamp >= :startDate', {
        startDate: queryStartDate,
      })
      .andWhere('login_event.timestamp <= :endDate', {
        endDate: queryEndDate,
      })
      .andWhere('login_event.successful = :successful', { successful: true })
      .groupBy(`TO_CHAR("login_event"."timestamp", '${sqlFormatPattern}')`)
      .orderBy('period', 'ASC')
      .getRawMany();

    // Get all periods in the range for ensuring complete data series
    const periodRange = getPeriodsInRange(queryStartDate, queryEndDate, span);
    const periodMap = createPeriodMap(periodRange, dateFormat);

    // Fill the map with actual data where available
    activeUsers.forEach((item) => {
      if (periodMap.has(item.period)) {
        periodMap.set(item.period, parseInt(item.count));
      }
    });

    // Convert map to array format
    const data = Array.from(periodMap.entries()).map(([period, count]) => ({
      [periodLabel]: period,
      count,
    }));

    const spanLabel = span.toLowerCase();

    return successHandler(
      `${spanLabel} active users trend retrieved successfully`,
      {
        startDate: startPeriodString,
        endDate: endPeriodString,
        span: spanLabel,
        data,
      },
    );
  }

  async getGrowthRateTrend(
    startDate?: Date,
    endDate?: Date,
    span: DurationSpan = DurationSpan.MONTHLY,
  ) {
    // Process the date parameters with forGrowth=true
    const {
      startPeriodString,
      endPeriodString,
      dateFormat,
      queryStartDate,
      queryEndDate,
    } = processDateParams(startDate, endDate, span, true);

    // Define SQL format based on span type
    let sqlFormatPattern: string;
    let periodLabel: string;

    switch (span) {
      case DurationSpan.WEEKLY:
        sqlFormatPattern = 'YYYY-IW';
        periodLabel = 'week';
        break;
      case DurationSpan.MONTHLY:
        sqlFormatPattern = 'YYYY-MM';
        periodLabel = 'month';
        break;
      default:
        sqlFormatPattern = 'YYYY-MM-DD';
        periodLabel = 'date';
    }

    // Use a single optimized query for all span types
    const periodUsers = await this.loginEventRepo
      .createQueryBuilder('login_event')
      .select(
        `TO_CHAR("login_event"."timestamp", '${sqlFormatPattern}')`,
        'period',
      )
      .addSelect('COUNT(DISTINCT "login_event"."userId")', 'count')
      .where('login_event.timestamp >= :startDate', {
        startDate: queryStartDate,
      })
      .andWhere('login_event.timestamp <= :endDate', {
        endDate: queryEndDate,
      })
      .andWhere('login_event.successful = :successful', { successful: true })
      .groupBy(`TO_CHAR("login_event"."timestamp", '${sqlFormatPattern}')`)
      .orderBy('period', 'ASC')
      .getRawMany();

    // Get all periods in the range for ensuring complete data series
    const periodRange = getPeriodsInRange(queryStartDate, queryEndDate, span);
    const periodMap = createPeriodMap(periodRange, dateFormat);

    // Fill the map with actual data where available
    periodUsers.forEach((item) => {
      if (periodMap.has(item.period)) {
        periodMap.set(item.period, parseInt(item.count));
      }
    });

    // Convert map to array and sort by period
    const periods = Array.from(periodMap.keys()).sort();

    // Calculate growth rates
    const growthData = periods.map((period, index) => {
      const currentCount = periodMap.get(period);
      const previousCount =
        index > 0 ? periodMap.get(periods[index - 1]) : currentCount;

      // Calculate growth rate with better handling for zero previous counts
      let growthRate = 0;
      if (previousCount === 0) {
        // If previous is zero but current has users, represent as "new users" with 100% growth
        growthRate = currentCount > 0 ? 100 : 0;
      } else {
        // Normal calculation when previous count is not zero
        growthRate = ((currentCount - previousCount) / previousCount) * 100;
      }

      // Create a base object with common properties
      const periodData: any = {
        userCount: currentCount,
        growthRate: Math.round(growthRate * 100) / 100, // Round to 2 decimal places
        previousPeriodCount: previousCount,
      };

      // Add period-specific label
      periodData[periodLabel] = period;

      return periodData;
    });

    const spanLabel = span.toLowerCase();

    return successHandler(
      `${spanLabel} user growth rate trend retrieved successfully`,
      {
        startDate: startPeriodString,
        endDate: endPeriodString,
        span: spanLabel,
        data: growthData,
      },
    );
  }

  async getUserSignupsTrend(
    startDate?: Date,
    endDate?: Date,
    span: DurationSpan = DurationSpan.DAILY,
  ) {
    // Process the date parameters
    const {
      startPeriodString,
      endPeriodString,
      dateFormat,
      queryStartDate,
      queryEndDate,
    } = processDateParams(startDate, endDate, span);

    // Define SQL format based on span type
    let sqlFormatPattern: string;
    let periodLabel: string;

    switch (span) {
      case DurationSpan.WEEKLY:
        sqlFormatPattern = 'YYYY-IW';
        periodLabel = 'week';
        break;
      case DurationSpan.MONTHLY:
        sqlFormatPattern = 'YYYY-MM';
        periodLabel = 'month';
        break;
      default:
        sqlFormatPattern = 'YYYY-MM-DD';
        periodLabel = 'date';
    }

    // Use a single optimized query for all span types
    const signupCounts = await this.userRepo
      .createQueryBuilder('user')
      .select(`TO_CHAR("user"."created_at", '${sqlFormatPattern}')`, 'period')
      .addSelect('COUNT("user"."id")', 'count')
      .where('user.created_at >= :startDate', { startDate: queryStartDate })
      .andWhere('user.created_at <= :endDate', { endDate: queryEndDate })
      .groupBy(`TO_CHAR("user"."created_at", '${sqlFormatPattern}')`)
      .orderBy('period', 'ASC')
      .getRawMany();

    // Get all periods in the range for ensuring complete data series
    const periodRange = getPeriodsInRange(queryStartDate, queryEndDate, span);
    const periodMap = createPeriodMap(periodRange, dateFormat);

    // Fill the map with actual data where available
    signupCounts.forEach((item) => {
      if (periodMap.has(item.period)) {
        periodMap.set(item.period, parseInt(item.count));
      }
    });

    // Convert map to array format
    const data = Array.from(periodMap.entries()).map(([period, count]) => ({
      [periodLabel]: period,
      count,
    }));

    // Calculate total signups in the period
    const totalSignups = data.reduce((sum, item) => sum + item.count, 0);

    const spanLabel = span.toLowerCase();

    return successHandler(
      `${spanLabel} user signups trend retrieved successfully`,
      {
        startDate: startPeriodString,
        endDate: endPeriodString,
        span: spanLabel,
        totalSignups,
        data,
      },
    );
  }
}
