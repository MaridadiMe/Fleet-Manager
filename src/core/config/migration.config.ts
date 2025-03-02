import { DataSource, DataSourceOptions } from 'typeorm';

const options: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  entities: [__dirname + '/../../modules/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  migrationsTableName: 'MIGRATIONS',
};

const dataSource = new DataSource({
  ...options,
});

export default dataSource;
