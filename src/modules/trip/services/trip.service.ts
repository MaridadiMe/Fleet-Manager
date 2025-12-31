import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { BaseService } from 'src/common/services/base.service';
import { Trip } from '../entities/trip.entity';
import { TripRepository } from '../repositories/trip.repository';
import { CreateTripDto } from '../dtos/create-trip.dto';
import { User } from 'src/modules/auth/types/user.type';
import { Between, Equal, Or } from 'typeorm';
import { TRIP_STATUS } from '../enums/trip-status.enum';
import { SearchTripsDto } from '../dtos/search-trip.dto';
import { ListTripsDto } from '../dtos/list-trip.dto';

@Injectable()
export class TripService extends BaseService<Trip> {
  private readonly logger = new Logger(TripService.name);
  constructor(protected readonly repository: TripRepository) {
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
    };
  }
}
