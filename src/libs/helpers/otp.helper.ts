/**
 *OTP HELPER
 */
export class otpHelper {
  static generatorOtp(): string {
    //4 digit generator otp
    return Math.floor(1000 + Math.random() * 9999).toString();
  }
}
