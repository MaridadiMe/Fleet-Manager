import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { BaseService } from 'src/common/services/base.service';
import { Vehicle } from '../entities/vehicle.entity';
import { VehicleRepository } from '../repositories/vehicle.repository';
import { CreateVehicleDto } from '../dtos/create-vehicle.dto';
import { User } from 'src/modules/auth/types/user.type';

@Injectable()
export class VehicleService extends BaseService<Vehicle> {
  private readonly logger = new Logger(VehicleService.name);
  constructor(protected readonly repository: VehicleRepository) {
    super(repository);
  }

  async createVehicle(dto: CreateVehicleDto, user: User): Promise<Vehicle> {
    let vehicleExists: boolean;
    try {
      vehicleExists = await this.repository.exists({
        where: { registrationNumber: dto.registrationNumber },
      });
    } catch (error) {
      this.logger.error('error');
      throw new InternalServerErrorException(`Error Registering The Vehicle`);
    }

    if (vehicleExists) {
      throw new BadRequestException(
        `Vehicle With Reg Number: ${dto.registrationNumber} Already Exists`,
      );
    }

    try {
      const vehicle = this.repository.create({
        ...dto,
        createdBy: user.userName,
      });
      return this.repository.save(vehicle);
    } catch (error) {
      this.logger.error('error');
      throw new InternalServerErrorException(`Error Registering The Vehicle`);
    }
  }
}
