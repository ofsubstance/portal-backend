import { Controller, Get, Header, Logger, Res } from '@nestjs/common';
import { Response } from 'express';
import { DataExportService } from './data-export.service';

@Controller('data-export')
export class DataExportController {
  private readonly logger = new Logger('DataExportController');

  constructor(private readonly dataExportService: DataExportService) {}

  @Get('all')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @Header('Content-Disposition', 'attachment; filename=database-export.xlsx')
  async exportAllData(@Res() res: Response): Promise<void> {
    this.logger.log('Received request to export all data');
    try {
      const data = await this.dataExportService.exportAllData();
      res.send(Buffer.from(data));
    } catch (error) {
      this.logger.error('Error during data export', error);
      res.status(500).json({
        message: 'Error generating export file',
        error: error.message,
      });
    }
  }
}
