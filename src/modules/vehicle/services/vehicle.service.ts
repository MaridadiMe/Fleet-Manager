import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BaseService } from 'src/common/services/base.service';
import { Vehicle } from '../entities/vehicle.entity';
import { VehicleRepository } from '../repositories/vehicle.repository';
import { CreateVehicleDto } from '../dtos/create-vehicle.dto';
import { User } from 'src/modules/auth/types/user.type';
import { DriverRepository } from 'src/modules/driver/repositories/driver.repository';

@Injectable()
export class VehicleService extends BaseService<Vehicle> {
  private readonly logger = new Logger(VehicleService.name);
  constructor(
    protected readonly vehicleRepository: VehicleRepository,
    private readonly driverRepository: DriverRepository,
  ) {
    super(vehicleRepository);
  }

  async createVehicle(dto: CreateVehicleDto, user: User): Promise<Vehicle> {
    let vehicleExists: boolean;
    try {
      dto.registrationNumber = dto.registrationNumber
        .replace(' ', '')
        .toUpperCase();

      vehicleExists = await this.vehicleRepository.exists({
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
      return this.vehicleRepository.save(vehicle);
    } catch (error) {
      this.logger.error('error');
      throw new InternalServerErrorException(`Error Registering The Vehicle`);
    }
  }

  async assignDriver(
    id: string,
    driverId: string,
    user: User,
  ): Promise<Vehicle> {
    try {
      const vehicle = await this.vehicleRepository.findOneBy({ id });
      if (!vehicle) {
        throw new NotFoundException('Vehicle Does Not Exist');
      }

      const driver = await this.driverRepository.findOneBy({ id: driverId });
      if (!driver) {
        throw new NotFoundException('Vehicle Does Not Exist');
      }

      // vehicle.driver = driver.id;
      return await this.vehicleRepository.save(vehicle);
      // return;
    } catch (error) {
      this.logger.error(`Error While Assigning Driver: ${error}`);
      throw error;
    }
  }
}
