import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { Driver } from '../entities/driver.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DriverRepository extends BaseRepository<Driver> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(dataSource, Driver);
  }
}
