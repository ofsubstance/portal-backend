import * as cookieParser from 'cookie-parser';

import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './exception-filters/http.exception-filter';
import { NestFactory } from '@nestjs/core';
import { flattenValidationErrors } from './utils/validation.util';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get<ConfigService>(ConfigService);

  app.enableCors({
    origin: configService.get('FRONTEND_URL'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
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
