import { Body, Catch, Controller, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from 'src/decorators/auth.decorator';
import { AuthService } from './auth.service';
import { CredLoginDto, GoogleLoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';

@Catch()
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('/signup')
  async signUp(
    @Req() req: Request,
    @Body() signUpDto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const signupResult = await this.authService.signUp(signUpDto);

    this.setTokenCookie(res, 'refreshToken', signupResult.body.refreshToken, 7);
    this.setTokenCookie(res, 'accessToken', signupResult.body.accessToken, 1);

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
      secure: false,
    });
  }

  @Public()
  @Post('/login')
  async login(
    @Req() req: Request,
    @Body() loginInfo: CredLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginInfo);
    console.log(result);

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
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    return;
  }

  @Public()
  @Post('google-login')
  async googleLogin(
    @Req() req,
    @Body() googleLoginDto: GoogleLoginDto,
    @Res({ passthrough: true }) res,
  ) {
    const result = await this.authService.googleLogin(googleLoginDto);

    this.setTokenCookie(res, 'refreshToken', result.body.refreshToken, 7);
    this.setTokenCookie(res, 'accessToken', result.body.accessToken, 1);

    return result;
  }
}
