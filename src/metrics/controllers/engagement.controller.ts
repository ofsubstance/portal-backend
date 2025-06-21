import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { AuthGuard } from 'src/guards/auth.guard';
import { TimeFrameDto } from '../dto/time-frame.dto';
import { DurationSpan } from '../enums/duration-span.enum';
import { EngagementMetricsService } from '../services/engagement-metrics.service';

@ApiTags('Engagement Metrics')
@Controller('metrics/engagement')
@Roles(Role.Admin) // Restrict access to admin users only
export class EngagementMetricsController {
  private readonly logger = new Logger('EngagementMetricsController');

  constructor(
    private readonly engagementMetricsService: EngagementMetricsService,
  ) {}

  @Get('session-time')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getAverageSessionTime(@Query() timeFrameDto: TimeFrameDto) {
    return this.engagementMetricsService.getAverageSessionTime(
      timeFrameDto,
      timeFrameDto.span || DurationSpan.DAILY,
    );
  }

  @Get('sessions')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getSessionMetrics(
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
  ) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    this.logger.log(
      `Getting session metrics from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    const metrics = await this.engagementMetricsService.getSessionMetrics(
      startDate,
      endDate,
    );

    return {
      status: 'success',
      data: metrics,
    };
  }

  @Get('sessions/by-timespan')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getSessionsByTimespan(
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
    @Query('span') span: DurationSpan = DurationSpan.DAILY,
  ) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    this.logger.log(
      `Getting ${span} session metrics from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    const timespanMetrics =
      await this.engagementMetricsService.getSessionsByTimespan(
        startDate,
        endDate,
        span,
      );

    return {
      status: 'success',
      data: timespanMetrics,
    };
  }

  @Get('sessions/daily')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getDailySessionMetrics(
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
  ) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    this.logger.log(
      `Getting daily session metrics from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    const dailyMetrics = await this.engagementMetricsService.getDailySessions(
      startDate,
      endDate,
    );

    return {
      status: 'success',
      data: dailyMetrics,
    };
  }

  @Get('distribution/utilization')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getUtilizationDistribution() {
    return this.engagementMetricsService.getUtilizationDistribution();
  }

  @Get('distribution/interests')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getInterestsDistribution() {
    return this.engagementMetricsService.getInterestsDistribution();
  }

  @Get('distribution/interests-overlap')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getInterestsOverlap() {
    return this.engagementMetricsService.getInterestsOverlap();
  }

  @Get('watch-rates')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getContentWatchRates(
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
  ) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    this.logger.log(
      `Getting content watch rates from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    return this.engagementMetricsService.getContentWatchRates(
      startDate,
      endDate,
    );
  }

  @Get('watch-rates/by-timespan')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getContentWatchRatesByTimespan(
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
    @Query('span') span: DurationSpan = DurationSpan.DAILY,
  ) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    this.logger.log(
      `Getting ${span} content watch rates from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    return this.engagementMetricsService.getContentWatchRatesByTimespan(
      startDate,
      endDate,
      span,
    );
  }

  @Get('distribution/interests-co-occurrence')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getInterestCoOccurrenceMatrix() {
    this.logger.log('Getting interest co-occurrence matrix');
    return this.engagementMetricsService.getInterestCoOccurrenceMatrix();
  }

  @Get('distribution/interests-sankey')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getInterestOverlapForSankey() {
    this.logger.log('Getting interest overlap data for Sankey diagram');
    return this.engagementMetricsService.getInterestOverlapForSankey();
  }
}
