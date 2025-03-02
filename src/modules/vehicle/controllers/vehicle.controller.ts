import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { BaseController } from 'src/common/controllers/base.controller';
import { VehicleService } from '../services/vehicle.service';
import { Vehicle } from '../entities/vehicle.entity';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateVehicleDto } from '../dtos/create-vehicle.dto';
import { AuthenticatedUser } from 'src/modules/auth/decorators/authenticated-user.decorator';
import { User } from 'src/modules/auth/types/user.type';
import { Permissions } from 'src/modules/auth/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Vehicles')
@Controller('vehicles')
export class VehicleController extends BaseController<Vehicle> {
  constructor(protected readonly service: VehicleService) {
    super(service);
  }

  @Get()
  @HttpCode(200)
  @Permissions('VIEW_VEHICLES')
  async findAll(): Promise<BaseResponseDto<Vehicle[]>> {
    const vehicles = await this.service.findAll();
    return new BaseResponseDto(vehicles);
  }

  @Post()
  @HttpCode(200)
  @Permissions('CREATE_VEHICLES')
  async create(
    @Body() dto: CreateVehicleDto,
    @AuthenticatedUser() user: User,
  ): Promise<BaseResponseDto<Vehicle>> {
    const vehicle = await this.service.createVehicle(dto, user);
    return new BaseResponseDto(vehicle);
  }
}
