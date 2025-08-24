import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from 'src/entities/comments.entity';
import { Feedback } from 'src/entities/feedbacks.entity';
import { LoginEvent } from 'src/entities/login_events.entity';
import { ShareableLink } from 'src/entities/sharable_links.entity';
import { Profile } from 'src/entities/user_profiles.entity';
import { UserSession } from 'src/entities/user_sessions.entity';
import { User } from 'src/entities/users.entity';
import { Video } from 'src/entities/videos.entity';
import { WatchSession } from 'src/entities/watch_sessions.entity';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';

@Injectable()
export class DataExportService {
  private readonly logger = new Logger('DataExportService');

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
    @InjectRepository(LoginEvent)
    private readonly loginEventRepo: Repository<LoginEvent>,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    @InjectRepository(UserSession)
    private readonly userSessionRepo: Repository<UserSession>,
    @InjectRepository(ShareableLink)
    private readonly shareableLinkRepo: Repository<ShareableLink>,
    @InjectRepository(WatchSession)
    private readonly watchSessionRepo: Repository<WatchSession>,
  ) {}

  async exportAllData(): Promise<Uint8Array> {
    this.logger.log('Starting full database export');

    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // Export each table to its own worksheet
      await Promise.all([
        this.exportTable(workbook, 'Users', this.userRepo),
        this.exportTable(workbook, 'Videos', this.videoRepo),
        this.exportTable(workbook, 'Comments', this.commentRepo),
        this.exportTable(workbook, 'Feedback', this.feedbackRepo),
        this.exportTable(workbook, 'Login Events', this.loginEventRepo),
        this.exportTable(workbook, 'User Profiles', this.profileRepo),
        this.exportTable(workbook, 'User Sessions', this.userSessionRepo),
        this.exportTable(workbook, 'Shareable Links', this.shareableLinkRepo),
        this.exportTable(workbook, 'Watch Sessions', this.watchSessionRepo),
      ]);

      // Write to buffer with proper options
      const wbout = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx',
        bookSST: false,
        compression: true,
      });

      return new Uint8Array(wbout);
    } catch (error) {
      this.logger.error('Error during data export', error);
      throw error;
    }
  }

  private async exportTable<T>(
    workbook: XLSX.WorkBook,
    sheetName: string,
    repository: Repository<T>,
  ): Promise<void> {
    this.logger.log(`Exporting ${sheetName}`);

    try {
      // Get all records with explicit relations
      const records = await repository.find({
        relations: [], // Empty array to avoid circular references
      });

      if (records.length === 0) {
        const ws = XLSX.utils.aoa_to_sheet([['No data available']]);
        XLSX.utils.book_append_sheet(workbook, ws, sheetName);
        return;
      }

      // Process records to handle special data types
      const processedRecords = records.map((record) => {
        const processedRecord = {};
        Object.entries(record).forEach(([key, value]) => {
          try {
            if (value === null || value === undefined) {
              processedRecord[key] = '';
            } else if (value instanceof Date) {
              processedRecord[key] = value.toISOString();
            } else if (Array.isArray(value)) {
              processedRecord[key] = JSON.stringify(value);
            } else if (typeof value === 'object') {
              // Handle circular references
              const seen = new WeakSet();
              const stringifyWithCircular = (obj: any): string => {
                return JSON.stringify(obj, (key, value) => {
                  if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) {
                      return '[Circular]';
                    }
                    seen.add(value);
                  }
                  return value;
                });
              };
              processedRecord[key] = stringifyWithCircular(value);
            } else {
              processedRecord[key] = value;
            }
          } catch (error) {
            this.logger.warn(
              `Error processing field ${key} in ${sheetName}`,
              error,
            );
            processedRecord[key] = '[Error: Unable to process value]';
          }
        });
        return processedRecord;
      });

      // Get headers from the first record
      const headers = Object.keys(processedRecords[0] || {});

      // Create worksheet with proper options
      const ws = XLSX.utils.json_to_sheet(processedRecords, {
        header: headers,
        cellDates: true,
        dateNF: 'yyyy-mm-dd hh:mm:ss',
      });

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    } catch (error) {
      this.logger.error(`Error exporting ${sheetName}`, error);
      // Create error sheet
      const ws = XLSX.utils.aoa_to_sheet([
        [`Error exporting ${sheetName}: ${error.message}`],
      ]);
      XLSX.utils.book_append_sheet(workbook, ws, `${sheetName} (Error)`);
    }
  }
}
