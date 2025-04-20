import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { TimeFrameDto } from '../dto/time-frame.dto';
import { DurationSpan } from '../enums/duration-span.enum';
import { EngagementMetricsService } from '../services/engagement-metrics.service';

@ApiTags('Engagement Metrics')
@Controller('metrics/engagement')
@Roles(Role.Admin) // Restrict access to admin users only
export class EngagementMetricsController {
  constructor(
    private readonly engagementMetricsService: EngagementMetricsService,
  ) {}

  @Get('session-time')
  async getAverageSessionTime(@Query() timeFrameDto: TimeFrameDto) {
    return this.engagementMetricsService.getAverageSessionTime(
      timeFrameDto,
      timeFrameDto.span || DurationSpan.DAILY,
    );
  }
}
