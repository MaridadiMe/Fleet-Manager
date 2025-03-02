import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const setupSwagger = (app: INestApplication) => {
  const options = new DocumentBuilder()
    .setTitle(`${process.env.APP_NAME}`)
    .setDescription('API Documentation')
    .setVersion(`${process.env.APP_VERSION}`)
    .addTag(`${process.env.APP_NAME}`)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  const url = `${process.env.API_BASE_URL}/documentation`;
  SwaggerModule.setup(url, app, document);
};
