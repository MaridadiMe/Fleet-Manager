import { MicroserviceOptions, Transport } from '@nestjs/microservices';

export const rabbitMqConfig = (): MicroserviceOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL],
    queue: process.env.RABBITMQ_QUEUE,
    queueOptions: { durable: true },
    noAck: false,
  },
});
