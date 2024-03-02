import {
  Body,
  Catch,
  Controller,
  Get,
  Post,
  Request,
  Response,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CredLoginDto, GoogleLoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';

@Catch()
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    return await this.authService.signUp(signUpDto);
  }

  @Post('/login')
  async login(
    @Request() req: any,
    @Body() loginInfo: CredLoginDto,
    @Response({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.login(loginInfo);

    res.cookie('refreshToken', result.body.refresh_token, {
      expires: new Date(new Date().setDate(new Date().getDate() + 7)),
      sameSite: 'none',
      httpOnly: true,
      secure: false,
    });
    res.header('Access-Control-Allow-Origin', req.headers.origin);

    return result;
  }

  @Get('/refresh')
  async refreshTokens(
    @Request() req: any,
    @Response({ passthrough: true }) res: any,
  ) {
    return await this.authService.refreshTokens(
      res,
      req,
      req.cookies.refreshToken,
    );
  }

  @Get('/logout')
  async logout(@Request() req: any, @Response({ passthrough: true }) res: any) {
    return await this.authService.logout(req, res);
  }

  @Post('google-login')
  async googleLogin(
    @Request() request,
    @Body() googleLoginDto: GoogleLoginDto,
    @Response({ passthrough: true }) res,
  ) {
    return await this.authService.googleLogin(request, googleLoginDto, res);
  }
}
