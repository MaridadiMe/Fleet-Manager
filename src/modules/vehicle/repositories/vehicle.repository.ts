import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { Vehicle } from '../entities/vehicle.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class VehicleRepository extends BaseRepository<Vehicle> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(dataSource, Vehicle);
  }
}
