import { MailService } from './mail.service';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
