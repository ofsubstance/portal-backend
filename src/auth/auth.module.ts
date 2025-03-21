import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt/dist';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/users.entity';
import { UsersModule } from 'src/users/users.module';

import { EmailService } from 'src/email.service';
import { LoginEvent } from 'src/entities/login_events.entity';
import { Profile } from 'src/entities/user_profiles.entity';
import { GoHighLevelModule } from 'src/gohighlevel/gohighlevel.module';
import { PasswordStrategy } from 'src/utils/password.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([User, Profile, LoginEvent]),
    JwtModule.register({}),
    GoHighLevelModule,
  ],
  providers: [AuthService, EmailService, PasswordStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
