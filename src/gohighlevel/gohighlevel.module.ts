import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoHighLevelService } from './gohighlevel.service';

@Module({
  imports: [ConfigModule],
  providers: [GoHighLevelService],
  exports: [GoHighLevelService],
})
export class GoHighLevelModule {}
