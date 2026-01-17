import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BaseService } from 'src/common/services/base.service';
import { Trip } from '../entities/trip.entity';
import { TripRepository } from '../repositories/trip.repository';
import { CreateTripDto } from '../dtos/create-trip.dto';
import { User } from 'src/modules/auth/types/user.type';
import {
  Between,
  DataSource,
  Equal,
  FindOptionsWhere,
  In,
  Not,
  Or,
} from 'typeorm';
import { TRIP_STATUS } from '../enums/trip-status.enum';
import { SearchTripsDto } from '../dtos/search-trip.dto';
import { ListTripsDto } from '../dtos/list-trip.dto';
import { TripSearchResultDto } from '../dtos/trip-search-result.dto';
import { Page } from 'src/common/pagination/page.interface';
import { BOOKING_STATUS } from '../enums/booking-status.enum';
import { Booking } from '../entities/booking.entity';
import { BookTripDto } from '../dtos/book-trip.dto';
import { DefaultConstants } from 'src/common/constants/default.constants';

@Injectable()
export class TripService extends BaseService<Trip> {
  private readonly logger = new Logger(TripService.name);
  constructor(
    protected readonly repository: TripRepository,
    private readonly dataSource: DataSource,
  ) {
    super(repository);
  }

  async createTrip(dto: CreateTripDto, user: User) {
    try {
      const tripTime = new Date(dto.departureAt);

      const windowStart = new Date(tripTime.getTime() - 30 * 60 * 1000);
      const windowEnd = new Date(tripTime.getTime() + 30 * 60 * 1000);

      const conflict = await this.repository.findOne({
        where: {
          driverId: dto.driverId,
          status: 'scheduled',
          departureAt: Between(windowStart, windowEnd),
        },
      });

      if (conflict) {
        throw new BadRequestException(
          'You already have another trip scheduled within 30 minutes of this time.',
        );
      }

      const trip = this.repository.create({
        ...dto,
        createdBy: user.userName,
      });
      return this.repository.save(trip);
    } catch (error) {
      this.logger.error(`Error Scheduling Trip`, error.message);
      throw error;
    }
  }

  async getUserTrips(user: User) {
    try {
      const where: FindOptionsWhere<Trip> = {
        bookings: {
          riderId: user.id,
          status: In([BOOKING_STATUS.RESERVED, BOOKING_STATUS.CONFIRMED]),
        },
      };
      const results = await this.findPaged(where, 1, 10, {
        relations: ['bookings', 'driver', 'driver.assignedVehicle'],
      });
      const paginatedUserTrips: Page<TripSearchResultDto> = {
        items: results.items.map((trip) => this.tripToDto(trip)),
        meta: results.meta,
      };
      return paginatedUserTrips;
    } catch (error) {
      this.logger.error('Error Getting Trips', error.message);
      throw new InternalServerErrorException('Error Getting User Trips');
    }
  }

  async listTrips(dto: ListTripsDto, user: User) {
    return this.findPaged(
      {
        status: dto.status,
        driverId: dto.driverId,
      },
      dto.page,
      dto.limit,
      {
        order: { departureAt: 'ASC' },
      },
    );
  }

  async searchTrips(
    dto: SearchTripsDto,
    user: User,
  ): Promise<TripSearchResultDto[]> {
    const {
      pickupLat,
      pickupLon,
      dropLat,
      dropLon,
      departureFrom,
      departureTo,
      radiusKm = 5,
    } = dto;

    const delta = radiusKm / 111;

    const candidateTrips = await this.getTrips(
      pickupLat,
      pickupLon,
      delta,
      departureFrom,
      departureTo,
    );

    if (candidateTrips.length === 0) {
      return [];
    }

    const matchingTrips = this.getMatchingTrips(
      candidateTrips,
      pickupLat,
      pickupLon,
      dropLat,
      dropLon,
    );

    return matchingTrips.map((trip) => this.tripToDto(trip));
  }

  private async getTrips(
    pickupLat,
    pickupLon,
    delta,
    departureFrom,
    departureTo,
  ) {
    return await this.repository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('driver.assignedVehicle', 'vehicle')
      .where('trip.status = :status', { status: TRIP_STATUS.SCHEDULED })
      .andWhere('trip.seatsAvailable > 0')
      .andWhere('trip.departureAt BETWEEN :from AND :to', {
        from: departureFrom,
        to: departureTo,
      })
      .andWhere('trip.startLat BETWEEN :minLat AND :maxLat', {
        minLat: pickupLat - delta,
        maxLat: pickupLat + delta,
      })
      .andWhere('trip.startLon BETWEEN :minLon AND :maxLon', {
        minLon: pickupLon - delta,
        maxLon: pickupLon + delta,
      })
      .getMany();
  }

  private getMatchingTrips(
    trips: Trip[],
    pickupLat: number,
    pickupLon: number,
    dropLat: number,
    dropLon: number,
  ) {
    const results = trips
      .map((trip) => {
        const angle = this.calculateRouteAngle(
          trip,
          pickupLat,
          pickupLon,
          dropLat,
          dropLon,
        );

        return {
          trip,
          routeAngle: angle,
          routeScore: 180 - angle, // smaller angle = higher score
        };
      })
      .filter((r) => r.routeAngle <= 45) // direction threshold
      .sort((a, b) => {
        // Higher route score first, then earlier departure
        if (b.routeScore !== a.routeScore) {
          return b.routeScore - a.routeScore;
        }
        return (
          new Date(a.trip.departureAt).getTime() -
          new Date(b.trip.departureAt).getTime()
        );
      });

    return results.map((r) => r.trip);
  }

  private calculateRouteAngle(
    trip: Trip,
    pickupLat: number,
    pickupLon: number,
    dropLat: number,
    dropLon: number,
  ): number {
    const tripVector = {
      x: trip.endLat - trip.startLat,
      y: trip.endLon - trip.startLon,
    };

    const riderVector = {
      x: dropLat - pickupLat,
      y: dropLon - pickupLon,
    };

    return this.angleBetweenVectors(
      tripVector.x,
      tripVector.y,
      riderVector.x,
      riderVector.y,
    );
  }

  private angleBetweenVectors(
    ax: number,
    ay: number,
    bx: number,
    by: number,
  ): number {
    const dot = ax * bx + ay * by;
    const magA = Math.sqrt(ax * ax + ay * ay);
    const magB = Math.sqrt(bx * bx + by * by);

    if (magA === 0 || magB === 0) return 180;

    const cosTheta = dot / (magA * magB);

    // clamp to avoid NaN
    const safeCos = Math.min(Math.max(cosTheta, -1), 1);

    return Math.acos(safeCos) * (180 / Math.PI);
  }

  private tripToDto(trip: Trip): TripSearchResultDto {
    const driver = trip.driver;
    const vehicle = driver?.assignedVehicle;
    const bookings = trip?.bookings || [];

    return {
      id: trip.id,
      startLat: trip.startLat,
      startLon: trip.startLon,
      startAddress: trip.startAddress,
      endLat: trip.endLat,
      endLon: trip.endLon,
      endAddress: trip.endAddress,
      departureAt: trip.departureAt,
      seatsTotal: trip.seatsTotal,
      seatsAvailable: trip.seatsAvailable,
      price: Number(trip.price),
      status: trip.status,

      driver: driver
        ? {
            id: driver.id,
            driverName: driver.driverName,
          }
        : null,

      vehicle: vehicle
        ? {
            id: vehicle.id,
            registrationNumber: vehicle.registrationNumber,
            type: vehicle.type,
          }
        : null,
      bookings: bookings.map((bk) => {
        return {
          id: bk.id,
          status: bk.status,
          seats: bk.seats,
          bookedAt: bk.createdAt,
        };
      }),
    };
  }

  async bookTrip(user: any, dto: BookTripDto): Promise<Booking> {
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
            Equal(BOOKING_STATUS.RESERVED),
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
        status: BOOKING_STATUS.RESERVED,
      });

      return await bookingRepo.save(booking);
    });
  }

  async cancelTrip(
    user: User,
    tripId: string,
    bookingId: string,
  ): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const tripRepo = manager.getRepository(Trip);
      const bookingRepo = manager.getRepository(Booking);

      // 🔒 Lock row to prevent concurrent bookings
      const trip = await tripRepo.findOne({
        where: { id: tripId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      if (trip.status !== TRIP_STATUS.SCHEDULED) {
        throw new BadRequestException(
          `Cannot Cancel a trip that is ${trip.status.toLowerCase()}`,
        );
      }

      const booking = await bookingRepo.findOne({
        where: {
          id: bookingId,
          tripId: tripId,
          riderId: user.id,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found for this user and trip');
      }

      if (booking.status == BOOKING_STATUS.CONFIRMED) {
        throw new BadRequestException(
          `Cannot Cancel a booking that is ${booking.status.toLowerCase()}`,
        );
      }

      if (booking.status == BOOKING_STATUS.CANCELLED) {
        throw new BadRequestException(
          `Booking is already ${booking.status.toLowerCase()}`,
        );
      }

      booking.status = BOOKING_STATUS.CANCELLED;
      booking.updatedBy = user.userName;
      await bookingRepo.save(booking);

      // Restore seats
      const newSeats = trip.seatsAvailable + booking.seats;

      if (newSeats > trip.seatsTotal) {
        throw new ConflictException('Seat count exceeds trip capacity');
      }

      trip.seatsAvailable = newSeats;
      trip.updatedBy = user.userName;
      await tripRepo.save(trip);
    });
  }
}
