// src/core/rabbitmq/rabbitmq.binding.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

@Injectable()
export class RabbitMQBindingService implements OnModuleInit {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async onModuleInit() {
    const channel = await this.rabbitMQService.getChannel(); // 👈 await!

    const queue = process.env.RABBITMQ_QUEUE;
    const exchange = process.env.RABBITMQ_EXCHANGE || 'events.exchange';
    const bindingKey = process.env.RABBITMQ_BINDING_KEY || 'payment.*';

    await channel.assertQueue(queue, { durable: true });

    await channel.bindQueue(queue, exchange, bindingKey);
    Logger.log('✅ Binding complete', 'RabbitMQBindingService');
  }
}
