import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AuthValidation,
  ForgotPasswordValidation,
  LoginValidation,
  OtpValidation,
  ResendOtpValidation,
  ResetPasswordValidation,
} from 'src/validation/auth/auth.validation';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register Controller
   * @param register
   * @returns
   */
  @Post('register')
  async RegisterController(@Body() register: AuthValidation) {
    const result = await this.authService.RegisterService(register);
    return {
      message: 'Register Berhasil',
      data: result.result,
      token: result.token,
    };
  }

  /**
   * Verify Otp Controller
   * @param otp
   * @returns
   */
  @Post('verify-otp')
  async verifyOtpController(@Body() otp: OtpValidation) {
    await this.authService.verifyOtpService(otp);
    return {
      message: 'Verify OTP Berhasil',
    };
  }

  /**
   * resend otp controller
   * @param resend
   * @returns
   */
  @Post('resend-otp')
  async resendOtpController(@Body() resend: ResendOtpValidation) {
    await this.authService.resendOtpService(resend);
    return {
      message: 'Resend OTP Berhasil dikirim',
    };
  }

  /**
   * forgot password controller
   * @param body
   * @returns
   */
  @Post('forgot-password')
  async forgotPasswordController(@Body() body: ForgotPasswordValidation) {
    await this.authService.forgotPasswordService(body);
    return {
      message: 'Link Reset Password Berhasil dikirim',
    };
  }

  /**
   * reset password controller
   * @param body
   * @param token
   * @returns
   */
  @Post('reset-password')
  async resetPasswordController(
    @Body() body: ResetPasswordValidation,
    @Query('token') token: string,
  ) {
    await this.authService.resetPasswordService(body, token);
    return {
      message: 'Berhasil mereset password anda',
    };
  }

  /**
   * Login Controller
   * @param body
   * @param res
   * @returns
   */
  @Post('login')
  async LoginController(
    @Body() body: LoginValidation,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.LoginService(body);
    //kirim cookie
    res.cookie('access_token', result.token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari expired
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    });
    return {
      message: 'Berhasil login',
      data: result.data,
    };
  }

  /**
   * Logout Controller
   * @param req
   * @param res
   * @returns
   */
  @Get('logout')
  LogoutController(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.LogoutService(req, res);
  }
}
