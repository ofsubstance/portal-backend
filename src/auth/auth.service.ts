import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { EmailService } from 'src/email.service';
import { Profile } from 'src/entities/user_profiles.entity';
import { User } from 'src/entities/users.entity';
import { Role } from 'src/enums/role.enum';
import { Status } from 'src/enums/status.enum';
import { UsersService } from 'src/users/users.service';
import { PasswordStrategy } from 'src/utils/password.strategy';
import { successHandler } from 'src/utils/response.handler';
import { Repository } from 'typeorm';
import { CredLoginDto, GoogleLoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Profile) private profileRepo: Repository<Profile>,
    private jwtService: JwtService,
    private passwordStrategy: PasswordStrategy,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async getTokens(userId: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, role },
        {
          secret: this.configService.get('ACCESS_TOKEN_SECRET'),
          expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRATION_TIME'),
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, role },
        {
          secret: this.configService.get('REFRESH_TOKEN_SECRET'),
          expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRATION_TIME'),
        },
      ),
    ]);

    const tokens = {
      accessToken,
      refreshToken,
    };

    return tokens;
  }

  generateEmailToken(email: string): string {
    return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
  }

  verifyEmailToken(token: string): string | object {
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  async signUp(signupUserDto: SignUpDto, userRole: Role = Role.User) {
    const user = await this.usersService.findUserByEmail(signupUserDto.email);
    if (user.length) {
      throw new BadRequestException('User with this email already exists');
    }

    const encPassword = await this.passwordStrategy.hashPassword(
      signupUserDto.password,
    );

    const emailToken = this.generateEmailToken(signupUserDto.email);

    const newProfile = this.profileRepo.create({
      business_name: signupUserDto.profile.businessName,
      website: signupUserDto.profile.website,
      state_region: signupUserDto.profile.stateRegion,
      country: signupUserDto.profile.country,
      utilization_purpose: signupUserDto.profile.utilizationPurpose, // Assuming Utilization is an enum
      interests: signupUserDto.profile.interests,
    });

    let newUser = this.userRepo.create({
      ...signupUserDto,
      password: encPassword,
      email_consent: signupUserDto.emailTermsConsent,
      sms_consent: signupUserDto.smsConsent,
      role: userRole,
      email_verification_token: emailToken,
      profile: newProfile, // Associate the profile
    });

    await this.emailService.sendVerificationEmail(
      signupUserDto.email,
      emailToken,
    );

    const createdUser = await this.userRepo.save(newUser);

    console.log(createdUser);

    delete newUser.password;

    return successHandler('User created successfully', {
      user: newUser,
    });
  }

  async resendVerificationEmail(email: string) {
    const [userInfo] = await this.usersService.findUserByEmail(email);
    if (!userInfo) {
      throw new NotFoundException('User with this email does not exist');
    }

    if (userInfo.status === 'active') {
      throw new BadRequestException('Account already verified');
    }

    const emailToken = this.generateEmailToken(email);

    await this.emailService.sendVerificationEmail(email, emailToken);

    await this.userRepo.update(userInfo.id, {
      email_verification_token: emailToken,
    });

    return successHandler('Verification email sent successfully', {});
  }

  async verifyEmail(token: string) {
    try {
      const payload: any = this.verifyEmailToken(token);

      const [userInfo] = await this.usersService.findUserByEmail(payload.email);

      if (!userInfo) {
        throw new NotFoundException('User with this email does not exist');
      }

      console.log(payload, userInfo);
      await this.userRepo.update(userInfo.id, {
        status: Status.Active,
      });

      return successHandler('Email verified successfully', {});
    } catch (error) {
      throw new BadRequestException(
        'Invalid or expired email verification token.',
      );
    }
  }

  async login(loginInfo: CredLoginDto) {
    const [userInfo] = await this.usersService.findUserByEmail(loginInfo.email);

    if (!userInfo) {
      throw new NotFoundException('User with this email does not exist');
    }

    if (userInfo.status === 'inactive') {
      throw new BadRequestException('Account Restricted!');
    }

    if (userInfo.status === 'unverified') {
      return successHandler('Account not verified', {
        email: userInfo.email,
      });
    }

    const isPasswordValid = await bcrypt.compare(
      loginInfo.password,
      userInfo.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }

    const tokens = await this.getTokens(userInfo.id, userInfo.role);

    delete userInfo.password;

    return successHandler('Login successful', {
      ...tokens,
      user: userInfo,
    });
  }

  async refreshTokens(token: string) {
    try {
      const decodedJwtRefreshToken: any = this.jwtService.decode(token);

      if (!decodedJwtRefreshToken) {
        throw new ForbiddenException('Access Denied');
      }
      const expires = decodedJwtRefreshToken.exp;

      if (expires < new Date().getTime() / 1000) {
        throw new ForbiddenException('Access Denied');
      }

      const userInfo = await this.userRepo.findOneBy({
        id: decodedJwtRefreshToken.sub,
      });

      if (!userInfo) {
        throw new ForbiddenException('Access Denied');
      }

      const tokens = await this.getTokens(userInfo.id, userInfo.role);

      delete userInfo.password;

      return successHandler('Login successful', {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: userInfo,
      });
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async googleLogin(googleLoginDto: GoogleLoginDto) {
    let [userInfo] = await this.usersService.findUserByEmail(
      googleLoginDto.email,
    );

    if (!userInfo) {
      const newUser = this.userRepo.create({
        ...googleLoginDto,
        role: Role.User,
      });
      userInfo = await this.userRepo.save(newUser);
    }

    const tokens = await this.getTokens(userInfo.id, userInfo.role);

    delete userInfo.password;

    return successHandler('Login successful', {
      ...tokens,
      user: userInfo,
    });
  }

  async forgotPassword(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    user.reset_pass_token = token;
    user.reset_pass_token_expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.userRepo.save(user);

    await this.emailService.sendPasswordResetEmail(email, token);

    return successHandler('Password reset link sent to your email.', {});
  }

  async resetPassword(token: string, newPassword: string) {
    console.log(token, newPassword);
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new BadRequestException('Invalid or expired token.');
    }

    const user = await this.userRepo.findOne({
      where: { reset_pass_token: token, id: decoded.id },
    });

    if (!user || user.reset_pass_token_expiry < new Date()) {
      throw new BadRequestException('Invalid or expired token.');
    }

    const encPassword = await this.passwordStrategy.hashPassword(newPassword);

    user.password = encPassword;
    user.reset_pass_token = null;
    user.reset_pass_token_expiry = null;
    await this.userRepo.save(user);

    return successHandler('Password reset successful.', {});
  }
}
