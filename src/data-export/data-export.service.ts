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

const CHUNK_SIZE = 1000;

// Columns omitted from the exported Users sheet
const USER_SENSITIVE_COLUMNS = new Set([
  'password',
  'reset_pass_token',
  'email_verification_token',
  'reset_pass_token_expiry',
]);

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

    const workbook = XLSX.utils.book_new();

    await Promise.all([
      this.exportTable(workbook, 'Users', this.userRepo, USER_SENSITIVE_COLUMNS),
      this.exportTable(workbook, 'Videos', this.videoRepo),
      this.exportTable(workbook, 'Comments', this.commentRepo),
      this.exportTable(workbook, 'Feedback', this.feedbackRepo),
      this.exportTable(workbook, 'Login Events', this.loginEventRepo),
      this.exportTable(workbook, 'User Profiles', this.profileRepo),
      this.exportTable(workbook, 'User Sessions', this.userSessionRepo),
      this.exportTable(workbook, 'Shareable Links', this.shareableLinkRepo),
      this.exportTable(workbook, 'Watch Sessions', this.watchSessionRepo),
    ]);

    const wbout = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      bookSST: false,
      compression: true,
    });

    return new Uint8Array(wbout);
  }

  private async exportTable<T>(
    workbook: XLSX.WorkBook,
    sheetName: string,
    repository: Repository<T>,
    sensitiveColumns: Set<string> = new Set(),
  ): Promise<void> {
    this.logger.log(`Exporting ${sheetName}`);

    try {
      // Load records in chunks to avoid OOM on large tables
      const allRecords: T[] = [];
      let offset = 0;
      let chunk: T[];

      do {
        chunk = await repository.find({
          skip: offset,
          take: CHUNK_SIZE,
          relations: [],
        });
        allRecords.push(...chunk);
        offset += CHUNK_SIZE;
      } while (chunk.length === CHUNK_SIZE);

      if (allRecords.length === 0) {
        const ws = XLSX.utils.aoa_to_sheet([['No data available']]);
        XLSX.utils.book_append_sheet(workbook, ws, sheetName);
        return;
      }

      const processedRecords = allRecords.map((record) => {
        const processedRecord: Record<string, any> = {};

        Object.entries(record).forEach(([key, value]) => {
          if (sensitiveColumns.has(key)) return; // omit sensitive fields

          try {
            if (value === null || value === undefined) {
              processedRecord[key] = '';
            } else if (value instanceof Date) {
              processedRecord[key] = value.toISOString();
            } else if (Array.isArray(value)) {
              processedRecord[key] = JSON.stringify(value);
            } else if (typeof value === 'object') {
              const seen = new WeakSet();
              processedRecord[key] = JSON.stringify(value, (_k, v) => {
                if (typeof v === 'object' && v !== null) {
                  if (seen.has(v)) return '[Circular]';
                  seen.add(v);
                }
                return v;
              });
            } else {
              processedRecord[key] = value;
            }
          } catch {
            processedRecord[key] = '[Error: unable to serialize]';
          }
        });

        return processedRecord;
      });

      const headers = Object.keys(processedRecords[0] ?? {});

      const ws = XLSX.utils.json_to_sheet(processedRecords, {
        header: headers,
        cellDates: true,
        dateNF: 'yyyy-mm-dd hh:mm:ss',
      });

      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    } catch (error) {
      this.logger.error(`Error exporting ${sheetName}`, error);
      const ws = XLSX.utils.aoa_to_sheet([
        [`Error exporting ${sheetName}: ${error.message}`],
      ]);
      XLSX.utils.book_append_sheet(workbook, ws, `${sheetName} (Error)`);
    }
  }
}
