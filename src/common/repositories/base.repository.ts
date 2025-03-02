import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, DeepPartial, EntityTarget, Repository } from 'typeorm';

export abstract class BaseRepository<T> extends Repository<T> {
  constructor(
    @InjectDataSource() dataSource: DataSource,
    entity: EntityTarget<T>,
  ) {
    super(entity, dataSource.createEntityManager());
  }
}
