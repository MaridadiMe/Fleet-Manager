import { Module } from '@nestjs/common';
import { TripController } from './controllers/trip.controller';
import { TripService } from './services/trip.service';
import { TripRepository } from './repositories/trip.repository';

@Module({
  imports: [],
  controllers: [TripController],
  providers: [TripService, TripRepository],
  exports: [],
})
export class TripModule {}
