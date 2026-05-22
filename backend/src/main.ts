import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger/logger.service';
import { QueueService } from './common/queue/queue.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new LoggerService(),
  });

  // Enable graceful shutdown hooks for Nest and providers
  app.enableShutdownHooks();

  // CORS configuration
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Sentry integration
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '1.0'),
    });
  }

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('StoryForge API')
    .setDescription('Convert stories to short-form videos')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Queue processors are registered via `@Processor('generation')` decorators
  // (no manual processor registration here) so Bull/Nest will route jobs.

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`✅ StoryForge Backend running on port ${port}`);
  console.log(`📚 API Docs: http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  console.error('❌ Bootstrap failed:', err);
  process.exit(1);
});
