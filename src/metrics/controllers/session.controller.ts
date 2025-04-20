import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../guards/auth.guard';
import { DurationSpan } from '../enums/duration-span.enum';
import { SessionMetricsService } from '../services/session-metrics.service';

@ApiTags('Session Metrics')
@Controller('metrics/sessions')
export class SessionMetricsController {
  private readonly logger = new Logger('SessionMetricsController');

  constructor(private readonly sessionMetricsService: SessionMetricsService) {}

  @Get()
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

    const metrics = await this.sessionMetricsService.getSessionMetrics(
      startDate,
      endDate,
    );

    return {
      status: 'success',
      data: metrics,
    };
  }

  @Get('by-timespan')
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
      await this.sessionMetricsService.getSessionsByTimespan(
        startDate,
        endDate,
        span,
      );

    return {
      status: 'success',
      data: timespanMetrics,
    };
  }

  @Get('daily')
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

    const dailyMetrics = await this.sessionMetricsService.getDailySessions(
      startDate,
      endDate,
    );

    return {
      status: 'success',
      data: dailyMetrics,
    };
  }
}
