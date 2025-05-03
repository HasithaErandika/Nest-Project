/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { BasicProcessingModule } from './basic-processing.module';

async function bootstrap() {
  const logger = new Logger('BasicProcessing');
  const app = await NestFactory.createMicroservice(BasicProcessingModule, {
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3001,
    },
  });

  await app.listen();
  logger.log('Basic Processing Microservice is listening on port 3001');
}

bootstrap();