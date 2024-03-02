import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt/dist';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from 'src/utils/auth/strategy/jwt.strategy';
import { PasswordStrategy } from 'src/utils/auth/strategy/password.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.register({}),
  ],
  providers: [AuthService, JwtStrategy, PasswordStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
