import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import { otpHelper } from 'src/libs/helpers/otp.helper';
import { MailService } from 'src/libs/mail/mail.service';
import { PrismaService } from 'src/libs/prisma-client/prisma.service';
import {
  AuthValidation,
  ForgotPasswordValidation,
  LoginValidation,
  OtpValidation,
  ResendOtpValidation,
  ResetPasswordValidation,
} from 'src/validation/auth/auth.validation';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mail: MailService,
  ) {}

  /**
   * Register Service
   * @param register
   * @returns
   */
  async RegisterService(register: AuthValidation) {
    //cek apakah email sudah terdaftar
    const findEmail = await this.prisma.users.findUnique({
      where: {
        email: register.email,
      },
    });
    if (findEmail) {
      throw new BadRequestException(
        'Email ini sebelumnya sudah terdaftar, harap gunakan email lain',
      );
    }
    //cek apakah password sama dengan confirm password
    if (register.password !== register.confirmPassword) {
      throw new BadRequestException(
        'Confirm Password tidak sama dengan Password yang di masukan',
      );
    }
    //kita hash password nya
    const hashPassword = await bcrypt.hash(register.password, 10);
    //generate otp
    const otp = otpHelper.generatorOtp();
    const otpExpired = new Date(Date.now() + 5 * 60 * 1000); // 5 menit expired code
    //create token
    const payload = { email: register.email };
    const token = this.jwtService.sign(payload, {
      expiresIn: '5m',
    });
    //create url frontend
    const url_frontend = `${process.env.CLIENT_HOST}/auth/verify?token=${token}`;
    try {
      //kita simpan data ke database
      const result = await this.prisma.users.create({
        data: {
          email: register.email,
          username: register.username,
          password: hashPassword,
          otpCode: otp,
          otpExpiredAt: otpExpired,
        },
      });
      //kita kirim mail untuk memverifikasi akun
      await this.mail.sendMailService({
        to: register.email,
        subject: 'Verifikasi Akun',
        template: 'auth/verify',
        context: {
          username: register.username,
          url: url_frontend,
          otp: otp,
          otpExp: 5, // 5 menit expired code
        },
      });
      return {
        result,
        token,
      };
    } catch (error) {
      throw new InternalServerErrorException('Terjadi kesalahan pada server');
    }
  }

  /**
   * verify OTP Service
   * token body
   * @param otp
   */
  async verifyOtpService(otp: OtpValidation): Promise<void> {
    try {
      let verify;
      //buat jwt token
      try {
        verify = this.jwtService.verify(otp.token);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          throw new BadRequestException(
            'OTP & Token Sudah expired, silahkan request ulang',
          );
        } else if (error.name === 'JsonWebTokenError') {
          throw new BadRequestException('Token tidak valid');
        }
      }

      //cari akun berdasarkan email
      const findEmail = await this.prisma.users.findUnique({
        where: { email: verify.email },
      });
      //jika tidak ada maka return error
      if (!findEmail) {
        throw new BadRequestException('Akun tidak ditemukan');
      }
      //cek apakah otp sudah expired atau belum
      if (findEmail.otpExpiredAt! < new Date()) {
        throw new BadRequestException(
          'OTP Sudah expired, silahkan request ulang',
        );
      }
      //cek apakah otp yang di masukan sama dengan otp di database
      if (findEmail.otpCode !== otp.otp) {
        throw new BadRequestException('OTP yang anda masukan salah');
      }
      //cek apakah akun sudah di verifikasi atau belum
      if (findEmail.verify === 1) {
        throw new BadRequestException(
          'Akun ini sebelumnya sudah di verifikasi',
        );
      }
      //update akun
      await this.prisma.users.update({
        where: { email: verify.email },
        data: {
          verify: 1,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * Resend OTP Service
   * @param resend
   * @returns
   */
  async resendOtpService(resend: ResendOtpValidation): Promise<void> {
    //cari akun berdasarkan email
    const findEmail = await this.prisma.users.findUnique({
      where: { email: resend.email },
    });
    //jika tidak ada maka return error
    if (!findEmail) {
      throw new BadRequestException('Akun tidak ditemukan');
    }
    //cek jika akun sudah di verifikasi
    if (findEmail.verify === 1) {
      throw new BadRequestException('Akun ini sebelumnya sudah di verifikasi');
    }
    //generate otp
    const otp = otpHelper.generatorOtp();
    const otpExpired = new Date(Date.now() + 5 * 60 * 1000); // 5 menit expired code
    //create token
    const payload = { email: findEmail.email };
    const token = this.jwtService.sign(payload, {
      expiresIn: '5m',
    });
    //create url frontend
    const url_frontend = `${process.env.CLIENT_HOST}/auth/resend-otp?token=${token}`;

    //update otp expired
    await this.prisma.users.update({
      where: { email: resend.email },
      data: {
        otpCode: otp,
        otpExpiredAt: otpExpired,
      },
    });
    //kita kirim mail untuk memverifikasi akun
    await this.mail.sendMailService({
      to: resend.email,
      subject: 'Resend OTP',
      template: 'auth/resend-otp',
      context: {
        username: findEmail.username,
        url: url_frontend,
        otp: otp,
        otpExp: 5, // 5 menit expired code
      },
    });
  }

  /**
   * reset password service
   * @param body
   */
  async forgotPasswordService(body: ForgotPasswordValidation): Promise<void> {
    //cek apakah email terdaftar atau tidak
    const findEmail = await this.prisma.users.findUnique({
      where: { email: body.email },
    });
    if (!findEmail) {
      throw new BadRequestException('Mohon maaf akun tidak ditemukan');
    }
    //buat sebuah token dan url
    //create token
    const payload = { email: findEmail.email };
    const token = this.jwtService.sign(payload, {
      expiresIn: '5m',
    });
    //create url frontend
    const url_frontend = `${process.env.CLIENT_HOST}/auth/forgot-password?token=${token}`;

    //kirim sebuah mail sender
    await this.mail.sendMailService({
      to: body.email,
      subject: 'Reset Password',
      template: 'auth/forgot-password',
      context: {
        username: findEmail.username,
        url: url_frontend,
      },
    });
  }

  /**
   * reset Password Service
   * @param body
   * @param token
   */
  async resetPasswordService(body: ResetPasswordValidation, token: string) {
    let verify;
    try {
      verify = this.jwtService.verify(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Token sudah expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Token tidak valid');
      }
    }
    //cari apakah email tersebut ada atau tidak
    const findEmail = await this.prisma.users.findUnique({
      where: {
        email: verify.email,
      },
    });
    if (!findEmail) {
      throw new BadRequestException('Mohon maaf akun tidak ditemukan');
    }
    //cek apakah password sama dengan confirm password
    if (body.password !== body.confirmPassword) {
      throw new BadRequestException(
        'Harap masukan password yang sama dengan confirm password',
      );
    }
    //kita hash password nya
    const hashPassword = await bcrypt.hash(body.password, 10);
    //update password
    await this.prisma.users.update({
      where: { email: verify.email },
      data: {
        password: hashPassword,
      },
    });
  }

  /**
   * Login Service
   * @param body
   */
  async LoginService(body: LoginValidation) {
    //cek apakah email sudah terdaftar atau belum
    const findEmail = await this.prisma.users.findUnique({
      where: {
        email: body.email,
      },
    });
    if (!findEmail) {
      throw new BadRequestException('Email ini belum terdaftar');
    }

    //cek apakah password sama dengan yang di database
    const checkPassword = await bcrypt.compare(
      body.password,
      findEmail.password,
    );
    if (!checkPassword) {
      throw new BadRequestException('Password yang anda masukan salah');
    }

    //cek apakah akun sudah di verifikasi atau belum
    if (findEmail.verify === 0) {
      throw new BadRequestException(
        'Akun belum di verifikasi, silakan verifikasi terlebih dahulu',
      );
    }

    //create token untuk disimpan di cookie
    const paylaod = { email: findEmail.email };
    const token = this.jwtService.sign(paylaod, {
      expiresIn: '7d',
    });
    return {
      data: findEmail,
      token,
    };
  }

  /**
   * logout service
   * @param req
   * @param res
   * @returns
   */
  async LogoutService(req: Request, res: Response) {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new BadRequestException(
        'Cookies tidak ada,Silahkan login terlebih dahulu',
      );
    }
    //logout clear cookie
    res.clearCookie('access_token', {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    });
    return {
      message: 'Berhasil logout',
    };
  }
}
