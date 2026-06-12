import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //global prefix
  app.setGlobalPrefix('api/v1');

  //global pipes validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  //enable cookie-parser
  app.use(cookieParser());

  //enable cors
  app.enableCors({
    origin: process.env.CLIENT_HOST,
    credentials: true,
  });

  await app.listen(process.env.PORT!);
}
bootstrap();
