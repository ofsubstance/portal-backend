import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { AuthGuard } from 'src/guards/auth.guard';
import { MacroContentMetricsService } from '../services/macro-content-metrics.service';

@ApiTags('Macro Content Metrics')
@Controller('metrics/macro-content')
@Roles(Role.Admin) // Restrict access to admin users only
export class MacroContentMetricsController {
  private readonly logger = new Logger('MacroContentMetricsController');

  constructor(
    private readonly macroContentMetricsService: MacroContentMetricsService,
  ) {}

  @Get('completion-rates')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getVideoCompletionRates(
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
  ) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    return this.macroContentMetricsService.getVideoCompletionRates(
      startDate,
      endDate,
    );
  }

  @Get('most-viewed')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getMostViewedVideos(
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
  ) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    return this.macroContentMetricsService.getMostViewedVideos(
      startDate,
      endDate,
    );
  }

  @Get('most-shared')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getMostSharedVideos(
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
  ) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    return this.macroContentMetricsService.getMostSharedVideos(
      startDate,
      endDate,
    );
  }

  @Get('link-clickthrough')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getLinkClickthroughRates(
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
  ) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    return this.macroContentMetricsService.getLinkClickthroughRates(
      startDate,
      endDate,
    );
  }
}
