import {
  Controller,
  Get,
  Logger,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { AuthGuard } from 'src/guards/auth.guard';
import {
  ContentMetricsService,
  TimePeriod,
} from '../services/content-metrics.service';

@ApiTags('Content Metrics')
@Controller('metrics/content')
@Roles(Role.Admin) // Restrict access to admin users only
export class ContentMetricsController {
  private readonly logger = new Logger('ContentMetricsController');

  constructor(private readonly contentMetricsService: ContentMetricsService) {}

  @Get(':videoId/views')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: TimePeriod,
    description: 'Time period for chart data: daily, weekly, or monthly',
  })
  async getVideoViews(
    @Param('videoId') videoId: string,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
    @Query('period') period: TimePeriod = TimePeriod.DAILY,
  ) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    this.logger.log(
      `Getting ${period} views for video ${videoId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    return this.contentMetricsService.getVideoViews(
      videoId,
      startDate,
      endDate,
      period,
    );
  }

  @Get(':videoId/average-percentage-watched')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: TimePeriod,
    description: 'Time period for chart data: daily, weekly, or monthly',
  })
  async getAveragePercentageWatched(
    @Param('videoId') videoId: string,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
    @Query('period') period: TimePeriod = TimePeriod.DAILY,
  ) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    this.logger.log(
      `Getting ${period} average percentage watched for video ${videoId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    return this.contentMetricsService.getAveragePercentageWatched(
      videoId,
      startDate,
      endDate,
      period,
    );
  }

  @Get(':videoId/share-count')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: TimePeriod,
    description: 'Time period for chart data: daily, weekly, or monthly',
  })
  async getShareCount(
    @Param('videoId') videoId: string,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
    @Query('period') period: TimePeriod = TimePeriod.DAILY,
  ) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    this.logger.log(
      `Getting ${period} share count for video ${videoId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    return this.contentMetricsService.getShareCount(
      videoId,
      startDate,
      endDate,
      period,
    );
  }

  @Get(':videoId/completion-and-drop-off-rates')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: TimePeriod,
    description: 'Time period for chart data: daily, weekly, or monthly',
  })
  async getCompletionAndDropOffRates(
    @Param('videoId') videoId: string,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
    @Query('period') period: TimePeriod = TimePeriod.DAILY,
  ) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    this.logger.log(
      `Getting ${period} completion and drop-off rates for video ${videoId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    return this.contentMetricsService.getCompletionAndDropOffRates(
      videoId,
      startDate,
      endDate,
      period,
    );
  }
}
