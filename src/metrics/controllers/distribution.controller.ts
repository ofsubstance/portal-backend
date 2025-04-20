import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { DistributionMetricsService } from '../services/distribution-metrics.service';

@ApiTags('Distribution Metrics')
@Controller('metrics/distribution')
@Roles(Role.Admin) // Restrict access to admin users only
export class DistributionMetricsController {
  constructor(
    private readonly distributionMetricsService: DistributionMetricsService,
  ) {}

  @Get('utilization')
  async getUtilizationDistribution() {
    return this.distributionMetricsService.getUtilizationDistribution();
  }

  @Get('interests')
  async getInterestsDistribution() {
    return this.distributionMetricsService.getInterestsDistribution();
  }

  @Get('interests-overlap')
  async getInterestsOverlap() {
    return this.distributionMetricsService.getInterestsOverlap();
  }
}
