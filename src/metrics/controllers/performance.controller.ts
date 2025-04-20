import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { DurationSpan } from '../enums/duration-span.enum';
import { PerformanceMetricsService } from '../services/performance-metrics.service';

@ApiTags('Performance Metrics')
@Controller('metrics/performance')
@Roles(Role.Admin) // Restrict access to admin users only
export class PerformanceMetricsController {
  constructor(
    private readonly performanceMetricsService: PerformanceMetricsService,
  ) {}

  @Get('active-users/daily')
  async getDailyActiveUsers(@Query('date') date?: string) {
    return this.performanceMetricsService.getDailyActiveUsers(
      date ? new Date(date) : new Date(),
    );
  }

  @Get('active-users/monthly')
  async getMonthlyActiveUsers(@Query('date') date?: string) {
    return this.performanceMetricsService.getMonthlyActiveUsers(
      date ? new Date(date) : new Date(),
    );
  }

  @Get('active-users/trend')
  async getActiveUsersTrend(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('span') span: DurationSpan = DurationSpan.DAILY,
  ) {
    return this.performanceMetricsService.getActiveUsersTrend(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      span,
    );
  }

  @Get('growth/trend')
  async getGrowthRateTrend(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('span') span: DurationSpan = DurationSpan.MONTHLY,
  ) {
    return this.performanceMetricsService.getGrowthRateTrend(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      span,
    );
  }

  @Get('growth/monthly')
  async getMonthlyGrowthRate(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.performanceMetricsService.getMonthlyGrowthRate(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('retention')
  @ApiOperation({
    summary: 'Get user retention rates by monthly cohorts',
    description:
      'Returns retention metrics for user cohorts based on their first login month. Shows retention rates for each subsequent month.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    example: '2025-01-01',
    description: 'Start date for cohort analysis (YYYY-MM-DD format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    example: '2025-12-31',
    description: 'End date for cohort analysis (YYYY-MM-DD format)',
  })
  async getUserRetentionRate(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.performanceMetricsService.getUserRetentionRate(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
