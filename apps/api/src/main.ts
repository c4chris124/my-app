import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import type { AuthConfig } from './config/auth.config.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const auth = config.getOrThrow<AuthConfig>('auth');

  // Behind a single reverse proxy (Vite dev / Nginx prod) — trust it so req.ip
  // and Secure-cookie handling honor X-Forwarded-* headers.
  app.set('trust proxy', 1);

  app.use(helmet());
  // Secret must match CookieService's signed session cookie.
  app.use(cookieParser(auth.session.secret));

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('REHOBOT API')
    .setDescription('B2B ecommerce platform API')
    .setVersion('1.0')
    .addCookieAuth(auth.session.cookieName)
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
