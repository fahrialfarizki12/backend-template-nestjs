import { MailModule } from './libs/mail/mail.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './libs/prisma-client/prisma.module';
import { Module } from '@nestjs/common';
import 'dotenv/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
@Module({
  imports: [
    MailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      global: true,
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: '`No Reply" <' + process.env.MAIL_USER + '>`',
      },
      template: {
        dir: join(process.cwd(), 'src/libs/mail/templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    AuthModule,
    PrismaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
