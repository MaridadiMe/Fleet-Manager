import { Module } from '@nestjs/common';
import { TripController } from './controllers/trip.controller';
import { TripService } from './services/trip.service';
import { TripRepository } from './repositories/trip.repository';
import { BookingRepository } from './repositories/booking.repository';
import { RestClientModule } from '../restclient/restclient.module';
@Module({
  imports: [RestClientModule],
  controllers: [TripController],
  providers: [TripService, TripRepository, BookingRepository],
  exports: [],
})
export class TripModule {}
