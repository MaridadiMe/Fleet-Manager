import { ConfigService } from '@nestjs/config';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';

export const databaseConnectionOptions = (
  configService: ConfigService,
): MysqlConnectionOptions => ({
  type: configService.get<string>('DB_TYPE') as any,
  host: configService.get<string>('DB_HOST'),
  port: parseInt(configService.get<string>('DB_PORT')),
  database: configService.get<string>('DB_NAME'),
  username: configService.get<string>('DB_USER'),
  password: configService.get<string>('DB_PASSWORD'),
  synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
  entities: [__dirname + '/../../modules/**/*.entity{.ts,.js}'],
});
