import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthValidation {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}

export class OtpValidation {
  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResendOtpValidation {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ForgotPasswordValidation {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordValidation {
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}

export class LoginValidation {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
