import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration module available to the entire application
    }),
  ],
})
export class AppConfigModule {}
