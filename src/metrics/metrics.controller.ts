import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { MetricsService } from './metrics.service';

@Controller('metrics')
@Roles(Role.Admin) // Restrict access to admin users only
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('dau')
  async getDailyActiveUsers(@Query('date') date?: string) {
    return this.metricsService.getDailyActiveUsers(
      date ? new Date(date) : new Date(),
    );
  }

  @Get('mau')
  async getMonthlyActiveUsers(@Query('date') date?: string) {
    return this.metricsService.getMonthlyActiveUsers(
      date ? new Date(date) : new Date(),
    );
  }

  @Get('dau/trend')
  async getDauTrend(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.metricsService.getDauTrend(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('mau/trend')
  async getMauTrend(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.metricsService.getMauTrend(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('growth/monthly')
  async getMonthlyGrowthRate(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.metricsService.getMonthlyGrowthRate(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('retention')
  async getUserRetentionRate(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.metricsService.getUserRetentionRate(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('distribution/utilization')
  async getUtilizationDistribution() {
    return this.metricsService.getUtilizationDistribution();
  }

  @Get('distribution/interests')
  async getInterestsDistribution() {
    return this.metricsService.getInterestsDistribution();
  }

  @Get('distribution/interests-overlap')
  async getInterestsOverlap() {
    return this.metricsService.getInterestsOverlap();
  }
}
