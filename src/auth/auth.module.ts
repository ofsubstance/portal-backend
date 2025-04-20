import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from 'src/email.service';
import { LoginEvent } from 'src/entities/login_events.entity';
import { Profile } from 'src/entities/user_profiles.entity';
import { User } from 'src/entities/users.entity';
import { GoHighLevelModule } from 'src/gohighlevel/gohighlevel.module';
import { UserSessionsModule } from 'src/user-sessions/user-sessions.module';
import { UsersModule } from 'src/users/users.module';
import { PasswordStrategy } from 'src/utils/password.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile, LoginEvent]),
    JwtModule.register({
      global: true,
      secret: process.env.ACCESS_TOKEN_SECRET || 'secret',
      signOptions: { expiresIn: '1h' },
    }),
    UserSessionsModule,
    UsersModule,
    GoHighLevelModule,
  ],
  providers: [AuthService, EmailService, PasswordStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
