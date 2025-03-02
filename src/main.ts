import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as dotenv from 'dotenv';
import { setupSwagger } from './core/config/swagger.config';
import { DataSource } from 'typeorm';
import { seedDatabase } from './core/database/database.seeder';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(process.env.API_BASE_URL ?? 'api/v1/app');
  const APP_PORT = process.env.APP_PORT;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  setupSwagger(app);

  await app.listen(APP_PORT);
  Logger.log(`APP PORT : ${APP_PORT}`, 'Bootstrap');

  const dataSource = app.get(DataSource);
  seedDatabase(dataSource);
}
bootstrap();
