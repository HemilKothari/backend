import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
    }),
  );

  const allowedOrigins =
    process.env.CORS_ORIGINS?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests without Origin header
      // Example: mobile apps, server-to-server requests, Swagger/Postman
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`Origin ${origin} is not allowed by CORS`),
        false,
      );
    },

    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],

    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],

    credentials: true,

    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,

      forbidNonWhitelisted: true,

      transform: true,

      transformOptions: {
        enableImplicitConversion: false,
      },

      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('AdOnTheGo API')
      .setDescription('AdOnTheGo Backend APIs')
      .setVersion('1.0')
      .addApiKey(
        {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'Enter: ApiKey <your-api-key>',
        },
        'player-api-key',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);

    writeFileSync('./openapi.json', JSON.stringify(document, null, 2));

    SwaggerModule.setup('api', app, document);
  }

  await app.listen(3000, '127.0.0.1');
}

bootstrap();
