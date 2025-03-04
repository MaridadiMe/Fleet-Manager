import { Body, Controller, Get, HttpCode, Logger, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BaseController } from 'src/common/controllers/base.controller';
import { Driver } from '../entities/driver.entity';
import { DriverService } from '../services/driver.service';
import { Permissions } from 'src/modules/auth/decorators/permissions.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { AuthenticatedUser } from 'src/modules/auth/decorators/authenticated-user.decorator';
import { User } from 'src/modules/auth/types/user.type';
import { CreateDriverDto } from '../dtos/create-driver.dto';

@ApiBearerAuth()
@ApiTags('Drivers')
@Controller('drivers')
export class DriverController extends BaseController<Driver> {
  private readonly logger = new Logger(DriverController.name);
  constructor(protected readonly service: DriverService) {
    super(service);
  }

  @Get()
  @HttpCode(200)
  @Permissions('VIEW_DRIVERS')
  async ViewDriver(
    @AuthenticatedUser() user: User,
  ): Promise<BaseResponseDto<Driver>> {
    const driver = await this.service.findAll();
    return new BaseResponseDto(driver);
  }

  @Post()
  @Permissions('CREATE_DRIVERS')
  async createDriver(
    @Body() dto: CreateDriverDto,
    @AuthenticatedUser() user: User,
  ): Promise<BaseResponseDto<Driver>> {
    const driver = await this.service.createDriver(dto, user);
    return new BaseResponseDto(driver);
  }
}
