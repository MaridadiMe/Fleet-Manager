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
import { DataSource } from 'typeorm';
import { Driver } from 'src/modules/driver/entities/driver.entity';

@Injectable()
export class VehicleService extends BaseService<Vehicle> {
  private readonly logger = new Logger(VehicleService.name);
  constructor(
    protected readonly vehicleRepository: VehicleRepository,
    private readonly driverRepository: DriverRepository,
    private readonly dataSource: DataSource,
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
    return await this.dataSource.transaction(async (manager) => {
      try {
        const vehicle = await manager.findOneBy(Vehicle, { id });
        if (!vehicle) {
          throw new NotFoundException('Vehicle Does Not Exist');
        }

        const driver = await manager.findOne(Driver, {
          where: { id: driverId },
          relations: ['assignedVehicle'],
        });

        if (!driver) {
          throw new NotFoundException('Driver Does Not Exist');
        }
        if (driver.assignedVehicle) {
          const previousAssigned = driver.assignedVehicle;
          previousAssigned.driver = null;
          previousAssigned.updatedBy = user.userName;
          await manager.save(previousAssigned);
          delete driver.assignedVehicle;
        }

        vehicle.driver = driver;
        vehicle.updatedBy = user.userName;
        await manager.save(vehicle);

        return vehicle;
      } catch (error) {
        this.logger.error(`Error While Assigning Driver: ${error}`);
        throw error;
      }
    });
  }
}
