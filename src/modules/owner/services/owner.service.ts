import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { OwnerRepository } from '../repositories/owner.repository';
import { DataSource } from 'typeorm';
import { BaseService } from 'src/common/services/base.service';
import { Owner } from '../entities/owner.entity';
import { CreateOwnerDto } from '../dtos/create-owner.dto';
import { User } from 'src/modules/auth/types/user.type';
import { UserService } from 'src/modules/auth/services/user.service';

@Injectable()
export class OwnerService extends BaseService<Owner> {
  private readonly logger = new Logger(OwnerService.name);
  constructor(
    protected readonly ownerRepository: OwnerRepository,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
  ) {
    super(ownerRepository);
  }

  async createOwner(dto: CreateOwnerDto, user: any): Promise<Owner> {
    this.logger.log('Creating owner');
    const ownerUserData: User = await this.userService.getUserById(dto.userId);

    const owner = this.repository.create({
      ...dto,
      name: `${ownerUserData.firstName} ${ownerUserData.lastName}`.toUpperCase(),
      email: ownerUserData.email,
      phone: ownerUserData.phone,
      createdBy: user.userName,
      updatedBy: user.userName,
    });

    try {
      return await this.repository.save(owner);
    } catch (error) {
      this.logger.error(`Error While Saving Owner: ${error}`);
      throw new InternalServerErrorException('Error Creating Owner');
    }
  }

  async findOwnerById(id: string, user: User): Promise<Owner> {
    this.logger.log('Finding owner by ID');
    try {
      return await this.repository.findOneOrFail({
        where: { id },
        relations: ['vehicles'],
      });
    } catch (error) {
      this.logger.error(`Error While Finding Owner: ${error}`);
      throw new InternalServerErrorException('Error Finding Owner');
    }
  }
}
