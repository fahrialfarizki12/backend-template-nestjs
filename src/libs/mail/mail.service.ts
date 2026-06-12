import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { MailInterface } from 'src/common/interfaces/mail/mail.interface';

@Injectable()
export class MailService {
  constructor(private readonly mailService: MailerService) {}

  async sendMailService(mailOptions: MailInterface): Promise<void> {
    try {
      await this.mailService.sendMail({
        to: mailOptions.to,
        subject: mailOptions.subject,
        template: mailOptions.template,
        context: mailOptions.context,
      });
      //succes send mail
      console.log(`✅ Email Successfully sent to ${mailOptions.to}`);
    } catch (error) {
      console.error(`❌ Error sending email: ${error}`);
    }
  }
}
