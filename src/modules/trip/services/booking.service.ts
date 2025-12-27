import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BaseService } from 'src/common/services/base.service';
import { Booking } from '../entities/booking.entity';
import { BookingRepository } from '../repositories/booking.repository';
import { TripRepository } from '../repositories/trip.repository';
import { DataSource, Equal, Or } from 'typeorm';
import { Trip } from '../entities/trip.entity';
import { BOOKING_STATUS } from '../enums/booking-status.enum';
import { TRIP_STATUS } from '../enums/trip-status.enum';
import { BookTripDto } from '../dtos/book-trip.dto';

@Injectable()
export class BookingService extends BaseService<Booking> {
  private readonly logger = new Logger(BookingService.name);
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly tripRepository: TripRepository,
    private readonly dataSource: DataSource,
  ) {
    super(bookingRepository);
  }

  /**
   * NOTE:
   * Seat reservation logic lives here temporarily.
   * This MUST move to Trip Service when Fleet Management is split.
   */

  async create(user: any, dto: BookTripDto): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      const tripRepo = manager.getRepository(Trip);
      const bookingRepo = manager.getRepository(Booking);

      // 🔒 Lock row to prevent concurrent bookings
      const trip = await tripRepo.findOne({
        where: { id: dto.tripId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      if (trip.status !== TRIP_STATUS.SCHEDULED) {
        throw new BadRequestException(
          'Cannot book a trip that is not scheduled',
        );
      }

      if (trip.seatsAvailable < dto.seats) {
        throw new BadRequestException(
          `Only ${trip.seatsAvailable} seats available`,
        );
      }

      const existingBooking = await bookingRepo.findOne({
        where: {
          tripId: dto.tripId,
          riderId: user.id,
          status: Or(
            Equal(BOOKING_STATUS.BOOKED),
            Equal(BOOKING_STATUS.CONFIRMED),
          ),
        },
      });

      if (existingBooking) {
        throw new BadRequestException(
          'You already have an active booking for this trip',
        );
      }

      // Update seats
      trip.seatsAvailable -= dto.seats;
      await tripRepo.save(trip);

      const booking = bookingRepo.create({
        tripId: dto.tripId,
        riderId: user.id,
        seats: dto.seats,
        createdBy: user.userName,
        status: BOOKING_STATUS.BOOKED,
      });

      return await bookingRepo.save(booking);
    });
  }
}
