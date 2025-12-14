import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { BaseService } from 'src/common/services/base.service';
import { Trip } from '../entities/trip.entity';
import { TripRepository } from '../repositories/trip.repository';
import { CreateTripDto } from '../dtos/create-trip.dto';
import { User } from 'src/modules/auth/types/user.type';
import { Between, Equal, Or } from 'typeorm';
import { TRIP_STATUS } from '../enums/trip-status.enum';
import { Driver } from 'src/modules/driver/entities/driver.entity';

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
}
