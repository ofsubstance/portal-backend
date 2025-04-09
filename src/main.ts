import * as cookieParser from 'cookie-parser';

import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './exception-filters/http.exception-filter';
import { flattenValidationErrors } from './utils/validation.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get<ConfigService>(ConfigService);

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://of-substance-frontend.vercel.app',
    ], // Allow both local and Vercel deployment
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
    credentials: true, // Allow credentials (cookies, HTTP authentication)
  });
  app.useGlobalPipes(
    new ValidationPipe({
      enableDebugMessages: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException(flattenValidationErrors(errors)),
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const options = new DocumentBuilder()
    .addServer('/api')
    .setTitle('API Doc')
    .setDescription('The API description')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.use(json({ limit: '50mb' }));

  app.use(cookieParser());

  app.setGlobalPrefix('api');

  await app.listen(configService.get('PORT'));

  const appUrl = await app.getUrl();

  console.log(`Application is running on: ${appUrl}/api`);
  console.log(`Swagger is running on: ${appUrl}/swagger`);
}
bootstrap();
