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
import { DataSource, EntityManager } from 'typeorm';
import { Driver } from 'src/modules/driver/entities/driver.entity';
import { DriverAssignment } from '../entities/driver-assignment.entity';
import { Owner } from 'src/modules/owner/entities/owner.entity';
import { VehicleOwnership } from '../entities/vehicle-ownership.entity';

@Injectable()
export class VehicleService extends BaseService<Vehicle> {
  private readonly logger = new Logger(VehicleService.name);
  constructor(
    protected readonly vehicleRepository: VehicleRepository,
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
      this.logger.error(`Error Checking Vehicle Existence: ${error.message}`);
      throw new InternalServerErrorException(`Error Registering The Vehicle`);
    }

    if (vehicleExists) {
      this.logger.log(
        `Vehicle With Reg Number: ${dto.registrationNumber} Already Exists`,
      );
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
      this.logger.error(`'error' While Creating Vehicle: ${error.message}`);
      this.logger.error(error.stack);
      throw new InternalServerErrorException(`Error Registering The Vehicle`);
    }
  }

  async findOne(id: string): Promise<Vehicle> {
    try {
      const vehicle = await this.vehicleRepository.findOne({
        where: { id },
        relations: ['driver', 'owner'],
      });
      if (!vehicle) {
        throw new NotFoundException('Vehicle Does Not Exist');
      }
      return vehicle;
    } catch (error) {
      this.logger.error(`Error While Fetching Vehicle: ${error}`);
      throw error;
    }
  }

  async assignDriver(
    id: string,
    driverId: string,
    user: User,
  ): Promise<Vehicle> {
    return await this.dataSource.transaction(async (manager) => {
      try {
        const { vehicle, driver } = await this.findVehicleAndDriver(
          manager,
          id,
          driverId,
        );

        if (driver.assignedVehicle) {
          const previousVehicle = driver.assignedVehicle;
          previousVehicle.driver = null;
          previousVehicle.updatedBy = user.userName;
          await manager.save(previousVehicle);

          // Close Previous Assignment
          await this.closeDriverAssignment(
            manager,
            previousVehicle,
            driver,
            user,
          );
        }

        delete driver.assignedVehicle;

        //Assign new Driver to the car
        vehicle.driver = driver;
        vehicle.updatedBy = user.userName;
        await manager.save(vehicle);

        // Save Assignment History
        await this.createDriverAssignment(manager, vehicle, driver, user);

        return vehicle;
      } catch (error) {
        this.logger.error(`Error While Assigning Driver: ${error}`);
        throw error;
      }
    });
  }

  async unAssignDriver(vehicleId: string, user: User) {
    return await this.dataSource.transaction(async (manager) => {
      try {
        const vehicle = await manager.findOne(Vehicle, {
          where: { id: vehicleId },
          relations: ['driver'],
        });

        if (!vehicle) {
          throw new NotFoundException('Vehicle Does Not Exist');
        }

        if (!vehicle.driver) {
          throw new BadRequestException('Driver Not Assigned To This Vehicle');
        }

        const driver = vehicle.driver;
        vehicle.driver = null;
        vehicle.updatedBy = user.userName;
        await manager.save(vehicle);

        // Close Assignment
        await manager
          .createQueryBuilder()
          .update(DriverAssignment)
          .set({ unassignedAt: new Date(), updatedBy: user.userName })
          .where('driverId = :driverId AND vehicleId = :vehicleId', {
            driverId: driver.id,
            vehicleId: vehicle.id,
          })
          .andWhere('unassignedAt IS NULL')
          .execute();

        return vehicle;
      } catch (error) {
        this.logger.error(`Error While Unassigning Driver: ${error}`);
        throw error;
      }
    });
  }

  async assignOwner(id: string, ownerId: string, user: User): Promise<Vehicle> {
    return await this.dataSource.transaction(async (manager) => {
      try {
        const { vehicle, owner } = await this.findVehicleAndOwner(
          manager,
          id,
          ownerId,
        );

        if (vehicle.owner) {
          await this.closeVehicleOwnership(
            manager,
            vehicle,
            vehicle.owner,
            user,
          );
        }

        vehicle.owner = owner;
        vehicle.updatedBy = user.userName;
        const updatedVehicle = await manager.save(vehicle);

        await this.createVehicleOwnerShip(manager, updatedVehicle, owner, user);

        return updatedVehicle;
      } catch (error) {
        this.logger.error(`Error While Assigning Owner: ${error.message}`);
        throw error;
      }
    });
  }

  private async closeDriverAssignment(
    manager: EntityManager,
    vehicle: Vehicle,
    driver: Driver,
    user: User,
  ) {
    await manager
      .createQueryBuilder()
      .update(DriverAssignment)
      .set({ unassignedAt: new Date(), updatedBy: user.userName })
      .where('driverId = :driverId AND vehicleId = :vehicleId', {
        driverId: driver.id,
        vehicleId: vehicle.id,
      })
      .andWhere('unassignedAt IS NULL')
      .execute();
  }

  private async findVehicleAndDriver(
    manager: EntityManager,
    vehicleId: string,
    driverId: string,
  ) {
    const vehicle = await manager.findOne(Vehicle, {
      where: { id: vehicleId },
      relations: ['driver'],
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle Does Not Exist');
    }

    const driver = await manager.findOne(Driver, {
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException('Driver Does Not Exist');
    }

    if (vehicle.driver && vehicle.driver.id === driver.id) {
      throw new BadRequestException(`Driver Already Assigned To This Vehicle`);
    }
    return { vehicle, driver };
  }

  private async createDriverAssignment(
    manager: EntityManager,
    vehicle: Vehicle,
    driver: Driver,
    user: User,
  ) {
    const driverAssignment = manager.create(DriverAssignment, {
      driver,
      vehicle,
      assignedAt: new Date(),
      createdBy: user.userName,
      updatedBy: user.userName,
    });
    await manager.save(driverAssignment);
  }

  private async findVehicleAndOwner(
    manager: EntityManager,
    vehicleId: string,
    ownerId: string,
  ) {
    const vehicle = await manager.findOne(Vehicle, {
      where: { id: vehicleId },
      relations: ['owner'],
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle Does Not Exist');
    }

    const owner = await manager.findOne(Owner, {
      where: { id: ownerId },
    });

    if (!owner) {
      throw new NotFoundException('Owner Does Not Exist');
    }

    if (vehicle.owner && vehicle.owner.id === owner.id) {
      throw new BadRequestException(`Vehicle Already Assigned To This Owner`);
    }
    return { vehicle, owner };
  }

  private async createVehicleOwnerShip(
    manager: EntityManager,
    vehicle: Vehicle,
    owner: Owner,
    user: User,
  ) {
    const vehicleOwnership = manager.create(VehicleOwnership, {
      owner,
      vehicle,
      assignedAt: new Date(),
      createdBy: user.userName,
      updatedBy: user.userName,
    });

    await manager.save(vehicleOwnership);
  }

  private async closeVehicleOwnership(
    manager: EntityManager,
    vehicle: Vehicle,
    owner: Owner,
    user: User,
  ) {
    await manager
      .createQueryBuilder()
      .update(VehicleOwnership)
      .set({ unassignedAt: new Date(), updatedBy: user.userName })
      .where('ownerId = :ownerId AND vehicleId = :vehicleId', {
        ownerId: owner.id,
        vehicleId: vehicle.id,
      })
      .andWhere('unassignedAt IS NULL')
      .execute();
  }
}
