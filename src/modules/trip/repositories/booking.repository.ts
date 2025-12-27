import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { Booking } from '../entities/booking.entity';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import dataSource from 'src/core/config/migration.config';
import { DataSource } from 'typeorm';

@Injectable()
export class BookingRepository extends BaseRepository<Booking> {
  // Booking service methods will be implemented here
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(dataSource, Booking);
  }
}
