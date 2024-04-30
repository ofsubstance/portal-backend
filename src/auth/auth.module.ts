import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt/dist';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/users.entity';
import { UsersModule } from 'src/users/users.module';

import { PasswordStrategy } from 'src/utils/password.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.register({}),
  ],
  providers: [AuthService, PasswordStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
