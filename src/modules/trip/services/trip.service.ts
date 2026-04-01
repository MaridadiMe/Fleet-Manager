import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  RequestMethod,
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
import { SearchNearbyTripsDto } from '../dtos/search-nearby-trips.dto';
import { PaymentData } from '../types/payment-data.type';
import { ConfigService } from '@nestjs/config';
import { RestclientService } from 'src/modules/restclient/restclient.service';
import { RequestPaymentDto } from '../dtos/request-payment.dto';
import { formatPhoneNumber } from 'src/common/helpers/app-helpers';

@Injectable()
export class TripService extends BaseService<Trip> {
  private readonly logger = new Logger(TripService.name);
  constructor(
    protected readonly repository: TripRepository,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly restClient: RestclientService,
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

  /**
   * Finds trips that start nearby the given location and depart on or after the requested time.
   * Used for "browse nearby available rides" feature (no drop-off required).
   */
  async findNearbyTrips(
    dto: SearchNearbyTripsDto,
    user?: User,
  ): Promise<TripSearchResultDto[]> {
    try {
      const {
        pickupLat,
        pickupLon,
        departureFrom,
        radiusKm = 10,
        limit = 20,
      } = dto;

      if (!pickupLat || !pickupLon || !departureFrom) {
        throw new BadRequestException(
          'startLat, startLon and departureFrom are required',
        );
      }

      // Approximate bounding box (fast & works without PostGIS)
      const delta = radiusKm / 111; // ~111 km per degree at equator (good enough approximation)

      const minLat = pickupLat - delta;
      const maxLat = pickupLat + delta;
      const minLon = pickupLon - delta;
      const maxLon = pickupLon + delta;

      this.logger.debug(departureFrom);

      const qb = this.repository
        .createQueryBuilder('trip')
        .leftJoinAndSelect('trip.driver', 'driver')
        .leftJoinAndSelect('driver.assignedVehicle', 'vehicle')
        .where('trip.status = :status', { status: TRIP_STATUS.SCHEDULED })
        .andWhere('trip.seatsAvailable > 0')
        .andWhere('trip.departureAt > :departureFrom', { departureFrom })
        .andWhere('trip.startLat BETWEEN :minLat AND :maxLat', {
          minLat,
          maxLat,
        })
        .andWhere('trip.startLon BETWEEN :minLon AND :maxLon', {
          minLon,
          maxLon,
        })

        .orderBy('trip.departureAt', 'ASC')
        .take(limit);

      const nearbyTrips = await qb.getMany();

      this.logger.debug(
        `Found ${nearbyTrips.length} nearby trips within ${radiusKm} km of (${pickupLat}, ${pickupLon})`,
      );

      return nearbyTrips.map((trip) => this.tripToDto(trip));
    } catch (error) {
      this.logger.error('Error Finding Nearby Trips', error.message);
      throw new InternalServerErrorException('Error Finding Nearby Trips');
    }
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
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

  async bookTrip(user: User, dto: BookTripDto): Promise<Booking> {
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

      const price = Number(trip.price) * dto.seats;
      // Do something here in the future
      // What if price is zero?
      // What if there are offers?

      const booking = bookingRepo.create({
        tripId: dto.tripId,
        riderId: user.id,
        riderEmail: user.email,
        riderName: user.firstName + ' ' + user.lastName,
        riderPhone: user.phone,
        seats: dto.seats,
        createdBy: user.userName,
        status: BOOKING_STATUS.RESERVED,
        bookingAmount: price,
      });

      return await bookingRepo.save(booking);
    });
  }

  async payForBooking(
    user: User,
    paymentMobileNo: string,
    tripId: string,
    bookingId: string,
  ): Promise<Booking> {
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

      if (
        trip.status == TRIP_STATUS.COMPLETED ||
        trip.status == TRIP_STATUS.CANCELLED
      ) {
        throw new BadRequestException(
          `This trip is already ${trip.status.toLowerCase()}`,
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

      if (
        booking.status == BOOKING_STATUS.CONFIRMED ||
        booking.status == BOOKING_STATUS.CANCELLED
      ) {
        throw new BadRequestException(
          `Booking is already ${booking.status.toLowerCase()}`,
        );
      }
      // Here we would integrate with the payment gateway and process the payment using the provided mobile number.
      const payload: RequestPaymentDto = {
        clientReference: booking.id,
        buyerName: booking.riderName,
        buyerEmail: booking.riderEmail,
        buyerPhone: formatPhoneNumber(paymentMobileNo),
        totalAmount: booking.bookingAmount.toString(),
        currency: 'TZS',
        description: `Payment for Ride Booking ${booking.id}`,
        pullFromWalllet: true,
      };

      await this.requestPayment(payload);
      return booking;
    });
  }

  async requestPayment(dto: RequestPaymentDto) {
    try {
      this.restClient.request({
        url: `${this.configService.get('PGW_BASE_URL')}${this.configService.get('PGW_ORDERS_ENDPOINT')}`,
        headers: {
          Authorization: `Bearer ${this.configService.get('IAM_TOKEN')}`,
        },
        payload: dto,
        method: RequestMethod.POST,
      });
    } catch (error) {
      this.logger.error('Error Requesting Payment', error.message);
      throw new InternalServerErrorException('Error Requesting Payment');
    }
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
      booking.canceledAt = new Date(Date.now());
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

  async handleBookingPayment(paymentData: PaymentData): Promise<void> {
    try {
      const bookingRepo = this.dataSource.getRepository(Booking);

      const booking = await bookingRepo.findOne({
        where: { id: paymentData.clientReference },
      });

      if (!booking) {
        this.logger.warn(
          `Booking not found for payment client reference: ${paymentData.clientReference}`,
        );
        return;
      }
      if (paymentData.status === 'PAID') {
        booking.status = BOOKING_STATUS.CONFIRMED;
        booking.updatedBy = 'system';
        booking.orderReference = paymentData.orderReference;
        booking.transactionReference = paymentData.transactionReference;
        booking.confirmedAt = new Date(Date.now());
        await bookingRepo.save(booking);
        this.logger.log(
          `Booking ${booking.id} confirmed for trip ${booking.tripId} after payment`,
        );

        const message = `Dear ${booking.riderName}, Your payment has been received and booking confirmed! Thank you for choosing Yatown.`;

        // Probably just raise and event and handle the rest out of here
        await this.sendSms(message, booking?.riderPhone);
      }
    } catch (error) {
      this.logger.error('Error handling booking payment', error.message);
      throw new InternalServerErrorException('Error handling booking payment');
    }
  }

  async sendSms(message: string, recipient: string) {
    try {
      const sendSmsPayload = {
        message,
        recipients: [recipient],
      };
      const token = `Bearer ${this.configService.get('IAM_TOKEN')}`;
      const nseUrl = this.configService.get('NSE_BASE_URL');
      const nseSmsEndpoint = this.configService.get('NSE_SMS_ENDPOINT');
      await this.restClient.request({
        url: `${nseUrl}${nseSmsEndpoint}`,
        method: RequestMethod.POST,
        payload: sendSmsPayload,
        headers: { Authorization: token },
      });
    } catch (error) {
      this.logger.error('Error While Sending SMS', error.message);
      return null;
    }
  }
}
