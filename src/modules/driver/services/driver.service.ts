import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BaseService } from 'src/common/services/base.service';
import { Driver } from '../entities/driver.entity';
import { DriverRepository } from '../repositories/driver.repository';
import { CreateDriverDto } from '../dtos/create-driver.dto';
import { User } from 'src/modules/auth/types/user.type';

@Injectable()
export class DriverService extends BaseService<Driver> {
  private readonly logger = new Logger(DriverService.name);
  constructor(protected readonly repository: DriverRepository) {
    super(repository);
  }

  async createDriver(dto: CreateDriverDto, user: User): Promise<Driver> {
    await this.validateProperty('licenceNumber', dto.licenceNumber);
    await this.validateProperty('nationalIdNumber', dto.nationalIdNumber);
    await this.validateProperty('userId', dto.userId);

    const driverUserData: User = await this.repository.getUser(dto.userId);

    const driver = this.repository.create({
      ...dto,
      driverName:
        `${driverUserData.firstName} ${driverUserData.lastName}`.toUpperCase(),
      email: driverUserData.email,
      phone: driverUserData.phone,
      createdBy: user.userName,
      updatedBy: user.userName,
    });

    try {
      return await this.repository.save(driver);
    } catch (error) {
      this.logger.error(`Error While Saving Driver: ${error}`);
      throw new InternalServerErrorException('Error Creating Driver');
    }
  }

  async validateProperty<K extends keyof Driver>(
    property: K,
    value: Driver[K],
  ) {
    let exists: boolean;
    try {
      exists = await this.repository.exists({
        where: { [property]: value },
      });
    } catch (error) {
      this.logger.error(`Error While Validating Property: ${error}`);
      throw new InternalServerErrorException(`Error Creating Driver`);
    }

    if (exists) {
      throw new BadRequestException(
        `The ${property} : ${value} Already Exists`,
      );
    }
  }

  async isUserValid(userId: string): Promise<boolean> {
    //TODO: Call IAM to validate user
    return true;
  }
}
