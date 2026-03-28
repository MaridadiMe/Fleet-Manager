import { Module } from '@nestjs/common';
import { RabbitMQPublisher } from './rabbitMq.publisher';
import { RabbitMQBindingService } from './rabbitMq-bindings.service';
import { RabbitMQService } from './rabbitmq.service';

@Module({
  providers: [RabbitMQPublisher, RabbitMQBindingService, RabbitMQService],
  exports: [RabbitMQPublisher],
})
export class RabbitMqModule {}
