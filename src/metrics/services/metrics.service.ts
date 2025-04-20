import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { LoginEvent } from 'src/entities/login_events.entity';
import { Profile } from 'src/entities/user_profiles.entity';
import { User } from 'src/entities/users.entity';
import { successHandler } from 'src/utils/response.handler';
import { Repository } from 'typeorm';
import { DurationSpan } from '../enums/duration-span.enum';

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(LoginEvent)
    private loginEventRepo: Repository<LoginEvent>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Profile)
    private profileRepo: Repository<Profile>,
  ) {}

  async getDailyActiveUsers(date: Date = new Date()) {
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    const uniqueUsers = await this.loginEventRepo
      .createQueryBuilder('login_event')
      .select('COUNT(DISTINCT "userId")', 'count')
      .where('login_event.timestamp >= :startDate', { startDate })
      .andWhere('login_event.timestamp <= :endDate', { endDate })
      .andWhere('login_event.successful = :successful', { successful: true })
      .getRawOne();

    return successHandler('Daily active users retrieved successfully', {
      date: startDate.toISOString().split('T')[0],
      count: parseInt(uniqueUsers.count),
    });
  }

  async getMonthlyActiveUsers(date: Date = new Date()) {
    const startDate = startOfMonth(date);
    const endDate = endOfMonth(date);

    const uniqueUsers = await this.loginEventRepo
      .createQueryBuilder('login_event')
      .select('COUNT(DISTINCT "userId")', 'count')
      .where('login_event.timestamp >= :startDate', { startDate })
      .andWhere('login_event.timestamp <= :endDate', { endDate })
      .andWhere('login_event.successful = :successful', { successful: true })
      .getRawOne();

    return successHandler('Monthly active users retrieved successfully', {
      month: startDate.toISOString().split('T')[0].substring(0, 7),
      count: parseInt(uniqueUsers.count),
    });
  }

  async getDauTrend(startDate?: Date, endDate?: Date) {
    const queryEndDate = endDate ? endOfDay(endDate) : endOfDay(new Date());
    const queryStartDate = startDate
      ? startOfDay(startDate)
      : startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

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

    const data = dailyUsers.map((day) => ({
      date: day.date,
      count: parseInt(day.count),
    }));

    return successHandler('Daily active users trend retrieved successfully', {
      startDate: queryStartDate.toISOString().split('T')[0],
      endDate: queryEndDate.toISOString().split('T')[0],
      data,
    });
  }

  async getMauTrend(startDate?: Date, endDate?: Date) {
    const queryEndDate = endDate ? endOfMonth(endDate) : endOfMonth(new Date());
    const queryStartDate = startDate
      ? startOfMonth(startDate)
      : startOfMonth(subMonths(new Date(), 11));

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

    const data = monthlyUsers.map((month) => ({
      month: month.month,
      count: parseInt(month.count),
    }));

    return successHandler('Monthly active users trend retrieved successfully', {
      startDate: queryStartDate.toISOString().split('T')[0].substring(0, 7),
      endDate: queryEndDate.toISOString().split('T')[0].substring(0, 7),
      data,
    });
  }

  async getMonthlyGrowthRate(startDate?: Date, endDate?: Date) {
    const queryEndDate = endDate ? endOfMonth(endDate) : endOfMonth(new Date());
    // Add one extra month at the start to calculate first month's growth rate
    const queryStartDate = startDate
      ? startOfMonth(startDate)
      : startOfMonth(subMonths(new Date(), 12));

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

    // Calculate growth rates
    const growthData = monthlyUsers.map((current, index) => {
      const currentCount = parseInt(current.count);
      const previousCount =
        index > 0 ? parseInt(monthlyUsers[index - 1].count) : currentCount;
      const growthRate =
        previousCount === 0
          ? 0
          : ((currentCount - previousCount) / previousCount) * 100;

      return {
        month: current.month,
        userCount: currentCount,
        growthRate: Math.round(growthRate * 100) / 100, // Round to 2 decimal places
        previousMonthCount: previousCount,
      };
    });

    return successHandler(
      'Monthly user growth rate trend retrieved successfully',
      {
        startDate: queryStartDate.toISOString().split('T')[0].substring(0, 7),
        endDate: queryEndDate.toISOString().split('T')[0].substring(0, 7),
        data: growthData,
      },
    );
  }

  async getUserRetentionRate(startDate?: Date, endDate?: Date) {
    const queryEndDate = endDate ? endOfMonth(endDate) : endOfMonth(new Date());
    const queryStartDate = startDate
      ? startOfMonth(startDate)
      : startOfMonth(subMonths(new Date(), 11));

    // First, get all users' first login dates within the period
    const firstLogins = await this.loginEventRepo
      .createQueryBuilder('login_event')
      .select('login_event.userId', 'userId')
      .addSelect('MIN(login_event.timestamp)', 'firstLogin')
      .where('login_event.timestamp >= :startDate', {
        startDate: queryStartDate,
      })
      .andWhere('login_event.timestamp <= :endDate', { endDate: queryEndDate })
      .andWhere('login_event.successful = :successful', { successful: true })
      .groupBy('login_event.userId')
      .getRawMany();

    // Get all login events for these users
    const userIds = firstLogins.map((user) => user.userId);
    const allLogins = await this.loginEventRepo
      .createQueryBuilder('login_event')
      .select('login_event.userId', 'userId')
      .addSelect('login_event.timestamp', 'loginDate')
      .where('login_event.userId IN (:...userIds)', { userIds })
      .andWhere('login_event.successful = :successful', { successful: true })
      .orderBy('login_event.timestamp', 'ASC')
      .getRawMany();

    // Calculate retention by month
    const retentionData = new Map();
    firstLogins.forEach((user) => {
      const firstLoginMonth = format(new Date(user.firstLogin), 'yyyy-MM');
      const userLogins = allLogins
        .filter((login) => login.userId === user.userId)
        .map((login) => format(new Date(login.loginDate), 'yyyy-MM'));

      // Initialize retention data for this cohort if not exists
      if (!retentionData.has(firstLoginMonth)) {
        retentionData.set(firstLoginMonth, {
          totalUsers: 0,
          retentionByMonth: new Map(),
        });
      }

      const cohortData = retentionData.get(firstLoginMonth);
      cohortData.totalUsers++;

      // Calculate retention for each subsequent month
      const uniqueLoginMonths = [...new Set(userLogins)];
      uniqueLoginMonths.forEach((loginMonth) => {
        if (loginMonth !== firstLoginMonth) {
          const monthDiff = this.getMonthDifference(
            new Date(firstLoginMonth + '-01'),
            new Date(loginMonth + '-01'),
          );
          if (monthDiff > 0) {
            if (!cohortData.retentionByMonth.has(monthDiff)) {
              cohortData.retentionByMonth.set(monthDiff, 0);
            }
            cohortData.retentionByMonth.set(
              monthDiff,
              cohortData.retentionByMonth.get(monthDiff) + 1,
            );
          }
        }
      });
    });

    // Format the retention data
    const formattedData = Array.from(retentionData.entries()).map(
      ([cohortMonth, data]) => {
        const retentionRates = {};
        data.retentionByMonth.forEach((count, month) => {
          retentionRates[`month${month}`] = Math.round(
            (count / data.totalUsers) * 100,
          );
        });

        return {
          cohort: cohortMonth,
          totalUsers: data.totalUsers,
          ...retentionRates,
        };
      },
    );

    return successHandler('User retention rates retrieved successfully', {
      startDate: queryStartDate.toISOString().split('T')[0].substring(0, 7),
      endDate: queryEndDate.toISOString().split('T')[0].substring(0, 7),
      data: formattedData,
    });
  }

  private getMonthDifference(startDate: Date, endDate: Date): number {
    return (
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      endDate.getMonth() -
      startDate.getMonth()
    );
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
    // Using unnest to handle array of interests
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
      percentage:
        Math.round((parseInt(stat.count) / totalProfiles) * 100 * 100) / 100,
    }));

    // Sort by count in descending order
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
    // Get pairs of interests that commonly occur together
    const overlapStats = await this.profileRepo
      .createQueryBuilder('profile')
      .select(
        'a.interest as interest1, b.interest as interest2, COUNT(*) as count',
      )
      .innerJoin('UNNEST(profile.interests)', 'a', 'true')
      .innerJoin('UNNEST(profile.interests)', 'b', 'a.interest < b.interest')
      .groupBy('a.interest, b.interest')
      .having('COUNT(*) > 1')
      .orderBy('COUNT(*)', 'DESC')
      .limit(20)
      .getRawMany();

    const totalProfiles = await this.profileRepo.count();

    const data = overlapStats.map((stat) => ({
      combination: [stat.interest1, stat.interest2],
      count: parseInt(stat.count),
      percentage:
        Math.round((parseInt(stat.count) / totalProfiles) * 100 * 100) / 100,
    }));

    return successHandler(
      'User interests overlap analysis retrieved successfully',
      {
        totalUsers: totalProfiles,
        data,
      },
    );
  }

  async getActiveUsersTrend(
    startDate?: Date,
    endDate?: Date,
    span: DurationSpan = DurationSpan.DAILY,
  ) {
    // Default dates if not provided
    const queryEndDate = this.getEndDate(endDate, span);
    const queryStartDate = this.getStartDate(startDate, span);

    let dateFormat: string;
    let groupByFormat: string;

    switch (span) {
      case DurationSpan.WEEKLY:
        dateFormat = 'yyyy-ww'; // Year-WeekNumber
        groupByFormat = "TO_CHAR(login_event.timestamp, 'YYYY-IW')";
        break;
      case DurationSpan.MONTHLY:
        dateFormat = 'yyyy-MM'; // Year-Month
        groupByFormat = "TO_CHAR(login_event.timestamp, 'YYYY-MM')";
        break;
      case DurationSpan.DAILY:
      default:
        dateFormat = 'yyyy-MM-dd'; // Year-Month-Day
        groupByFormat = 'DATE(login_event.timestamp)';
        break;
    }

    const activeUsers = await this.loginEventRepo
      .createQueryBuilder('login_event')
      .select(groupByFormat, 'period')
      .addSelect('COUNT(DISTINCT "userId")', 'count')
      .where('login_event.timestamp >= :startDate', {
        startDate: queryStartDate,
      })
      .andWhere('login_event.timestamp <= :endDate', { endDate: queryEndDate })
      .andWhere('login_event.successful = :successful', { successful: true })
      .groupBy(groupByFormat)
      .orderBy('period', 'ASC')
      .getRawMany();

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

    const data = activeUsers.map((item) => ({
      [periodLabel]: item.period,
      count: parseInt(item.count),
    }));

    const spanLabel = span.toLowerCase();

    return successHandler(
      `${spanLabel} active users trend retrieved successfully`,
      {
        startDate: format(queryStartDate, dateFormat),
        endDate: format(queryEndDate, dateFormat),
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
    // Default dates if not provided
    const queryEndDate = this.getEndDate(endDate, span);
    // Add one extra period at the start to calculate first period's growth rate
    const queryStartDate = this.getAdditionalStartDate(startDate, span);

    let groupByFormat: string;
    let dateFormat: string;

    switch (span) {
      case DurationSpan.WEEKLY:
        dateFormat = 'yyyy-ww'; // Year-WeekNumber
        groupByFormat = "TO_CHAR(login_event.timestamp, 'YYYY-IW')";
        break;
      case DurationSpan.MONTHLY:
        dateFormat = 'yyyy-MM'; // Year-Month
        groupByFormat = "TO_CHAR(login_event.timestamp, 'YYYY-MM')";
        break;
      case DurationSpan.DAILY:
        dateFormat = 'yyyy-MM-dd'; // Year-Month-Day
        groupByFormat = 'DATE(login_event.timestamp)';
        break;
      default:
        throw new Error('Invalid timespan');
    }

    const periodUsers = await this.loginEventRepo
      .createQueryBuilder('login_event')
      .select(groupByFormat, 'period')
      .addSelect('COUNT(DISTINCT "userId")', 'count')
      .where('login_event.timestamp >= :startDate', {
        startDate: queryStartDate,
      })
      .andWhere('login_event.timestamp <= :endDate', { endDate: queryEndDate })
      .andWhere('login_event.successful = :successful', { successful: true })
      .groupBy(groupByFormat)
      .orderBy('period', 'ASC')
      .getRawMany();

    // Calculate growth rates
    const growthData = periodUsers.map((current, index) => {
      const currentCount = parseInt(current.count);
      const previousCount =
        index > 0 ? parseInt(periodUsers[index - 1].count) : currentCount;
      const growthRate =
        previousCount === 0
          ? 0
          : ((currentCount - previousCount) / previousCount) * 100;

      // Create a base object with common properties
      const periodData: any = {
        userCount: currentCount,
        growthRate: Math.round(growthRate * 100) / 100, // Round to 2 decimal places
        previousPeriodCount: previousCount,
      };

      // Add period-specific label
      switch (span) {
        case DurationSpan.WEEKLY:
          periodData.week = current.period;
          break;
        case DurationSpan.MONTHLY:
          periodData.month = current.period;
          break;
        case DurationSpan.DAILY:
          periodData.date = current.period;
          break;
      }

      return periodData;
    });

    const spanLabel = span.toLowerCase();

    return successHandler(
      `${spanLabel} user growth rate trend retrieved successfully`,
      {
        startDate: format(this.getStartDate(startDate, span), dateFormat),
        endDate: format(queryEndDate, dateFormat),
        span: spanLabel,
        data: growthData,
      },
    );
  }

  // Helper methods for date calculations
  private getStartDate(date: Date | undefined, span: DurationSpan): Date {
    if (date) {
      switch (span) {
        case DurationSpan.WEEKLY:
          return startOfWeek(date);
        case DurationSpan.MONTHLY:
          return startOfMonth(date);
        case DurationSpan.DAILY:
        default:
          return startOfDay(date);
      }
    } else {
      // Default start dates based on span
      switch (span) {
        case DurationSpan.WEEKLY:
          const nineWeeksAgo = new Date();
          nineWeeksAgo.setDate(nineWeeksAgo.getDate() - 9 * 7);
          return startOfWeek(nineWeeksAgo);
        case DurationSpan.MONTHLY:
          return startOfMonth(subMonths(new Date(), 11));
        case DurationSpan.DAILY:
        default:
          return startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      }
    }
  }

  private getEndDate(date: Date | undefined, span: DurationSpan): Date {
    if (date) {
      switch (span) {
        case DurationSpan.WEEKLY:
          return endOfWeek(date);
        case DurationSpan.MONTHLY:
          return endOfMonth(date);
        case DurationSpan.DAILY:
        default:
          return endOfDay(date);
      }
    } else {
      switch (span) {
        case DurationSpan.WEEKLY:
          return endOfWeek(new Date());
        case DurationSpan.MONTHLY:
          return endOfMonth(new Date());
        case DurationSpan.DAILY:
        default:
          return endOfDay(new Date());
      }
    }
  }

  private getAdditionalStartDate(
    date: Date | undefined,
    span: DurationSpan,
  ): Date {
    const startDate = this.getStartDate(date, span);

    switch (span) {
      case DurationSpan.WEEKLY:
        // Subtract one week
        const oneWeekBefore = new Date(startDate);
        oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);
        return startOfWeek(oneWeekBefore);
      case DurationSpan.MONTHLY:
        // Subtract one month
        return startOfMonth(subMonths(startDate, 1));
      case DurationSpan.DAILY:
      default:
        // Subtract one day
        const oneDayBefore = new Date(startDate);
        oneDayBefore.setDate(oneDayBefore.getDate() - 1);
        return startOfDay(oneDayBefore);
    }
  }
}
