import { Module } from '@nestjs/common';
import { TripController } from './controllers/trip.controller';
import { TripService } from './services/trip.service';
import { TripRepository } from './repositories/trip.repository';
import { BookingController } from './controllers/booking.controller';
import { BookingRepository } from './repositories/booking.repository';
import { BookingService } from './services/booking.service';

@Module({
  imports: [],
  controllers: [TripController, BookingController],
  providers: [TripService, TripRepository, BookingRepository, BookingService],
  exports: [],
})
export class TripModule {}
