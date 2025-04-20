import {
  Body,
  Catch,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from 'src/decorators/auth.decorator';
import { UserSessionsService } from 'src/user-sessions/user-sessions.service';
import { AuthService } from './auth.service';
import { CredLoginDto, GoogleLoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';

@Catch()
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userSessionsService: UserSessionsService,
  ) {}

  @Public()
  @Get('/verify-email')
  async verifyEmail(@Req() req: Request) {
    const { token } = req.query;
    return this.authService.verifyEmail(token as string);
  }

  @Public()
  @Post('/signup')
  async signUp(
    @Req() req: Request,
    @Body() signUpDto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const signupResult = await this.authService.signUp(signUpDto);
    return signupResult;
  }

  async setTokenCookie(
    res: Response,
    key: string,
    token: string,
    expiresIn: number,
  ) {
    res.cookie(key, token, {
      expires: new Date(new Date().setDate(new Date().getDate() + expiresIn)),
      sameSite: 'none',
      httpOnly: true,
      secure: true,
    });
  }

  @Public()
  @Post('/resendVerification')
  async resendVerificationEmail(@Body('email') email: string) {
    return await this.authService.resendVerificationEmail(email);
  }

  @Public()
  @Post('/login')
  async login(
    @Req() req: Request,
    @Body() loginInfo: CredLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginInfo, req);

    this.setTokenCookie(res, 'refreshToken', result.body.refreshToken, 7);
    this.setTokenCookie(res, 'accessToken', result.body.accessToken, 1);

    return result;
  }

  @Public()
  @Post('/refresh')
  async getNewTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refreshTokens(
      req.cookies.refreshToken,
    );

    this.setTokenCookie(res, 'refreshToken', result.body.refreshToken, 7);
    this.setTokenCookie(res, 'accessToken', result.body.accessToken, 1);

    return result;
  }

  @Public()
  @Post('/logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // End the session if provided
    const sessionId = req.body.sessionId;
    if (sessionId) {
      await this.userSessionsService.endSession(sessionId);
    }

    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    return { status: 'success' };
  }

  @Public()
  @Post('google-login')
  async googleLogin(
    @Req() req,
    @Body() googleLoginDto: GoogleLoginDto,
    @Res({ passthrough: true }) res,
  ) {
    const result = await this.authService.googleLogin(googleLoginDto, req);

    this.setTokenCookie(res, 'refreshToken', result.body.refreshToken, 7);
    this.setTokenCookie(res, 'accessToken', result.body.accessToken, 1);

    return result;
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return await this.authService.forgotPassword(email);
  }

  @Public()
  @Put('reset-password/:token')
  async resetPassword(
    @Param('token') token: string,
    @Body('password') newPassword: string,
  ) {
    return await this.authService.resetPassword(token, newPassword);
  }
}
