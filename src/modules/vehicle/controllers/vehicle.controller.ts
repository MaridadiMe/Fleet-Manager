import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
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

  @Get(':id')
  @HttpCode(200)
  @Permissions('VIEW_VEHICLES')
  async findOne(@Param('id') id: string): Promise<BaseResponseDto<Vehicle>> {
    const vehicle = await this.service.findOne(id);
    return new BaseResponseDto(vehicle);
  }

  @Post()
  @HttpCode(201)
  @Permissions('CREATE_VEHICLES')
  async create(
    @Body() dto: CreateVehicleDto,
    @AuthenticatedUser() user: User,
  ): Promise<BaseResponseDto<Vehicle>> {
    const vehicle = await this.service.createVehicle(dto, user);
    return new BaseResponseDto(vehicle);
  }

  @Patch(':id/assign-driver')
  @HttpCode(200)
  @Permissions('CREATE_VEHICLES')
  async assignDriver(
    @Param('id') id: string,
    @Query('driverId') driverId: string,
    @AuthenticatedUser() user: User,
  ): Promise<BaseResponseDto<Vehicle>> {
    const vehicle = await this.service.assignDriver(id, driverId, user);
    return new BaseResponseDto(vehicle);
  }

  @Patch(':id/unassign-driver')
  @HttpCode(200)
  @Permissions('CREATE_VEHICLES')
  async unAssignDriver(
    @Param('id') id: string,
    @AuthenticatedUser() user: User,
  ): Promise<BaseResponseDto<Vehicle>> {
    const vehicle = await this.service.unAssignDriver(id, user);
    return new BaseResponseDto(vehicle);
  }

  @Patch(':id/assign-owner')
  @HttpCode(200)
  @Permissions('CREATE_VEHICLES')
  async assignOwner(
    @Param('id') id: string,
    @Query('ownerId') ownerId: string,
    @AuthenticatedUser() user: User,
  ): Promise<BaseResponseDto<Vehicle>> {
    const vehicle = await this.service.assignOwner(id, ownerId, user);
    return new BaseResponseDto(vehicle);
  }
}
