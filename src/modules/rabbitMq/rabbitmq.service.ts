// src/core/rabbitmq/rabbitmq.service.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService {
  private channelPromise: Promise<amqp.Channel>;

  constructor() {
    this.channelPromise = this.init();
  }

  private async init(): Promise<amqp.Channel> {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();

    const exchange = process.env.RABBITMQ_EXCHANGE || 'events.exchange';
    const exchangeType = process.env.RABBITMQ_EXCHANGE_TYPE || 'topic';

    await channel.assertExchange(exchange, exchangeType, {
      durable: true,
    });

    Logger.log('✅ RabbitMQ connected', 'RabbitMQService');

    return channel;
  }

  async getChannel(): Promise<amqp.Channel> {
    return this.channelPromise;
  }
}
