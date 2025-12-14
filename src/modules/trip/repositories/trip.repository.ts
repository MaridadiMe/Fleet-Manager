import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { Trip } from '../entities/trip.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class TripRepository extends BaseRepository<Trip> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(dataSource, Trip);
  }
}
