import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import { OwnerService } from '../services/owner.service';
import { Owner } from '../entities/owner.entity';
import { BaseController } from 'src/common/controllers/base.controller';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { AuthenticatedUser } from 'src/modules/auth/decorators/authenticated-user.decorator';
import { User } from 'src/modules/auth/types/user.type';
import { Permissions } from 'src/modules/auth/decorators/permissions.decorator';
import { CreateOwnerDto } from '../dtos/create-owner.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Owners')
@Controller('owners')
@ApiBearerAuth()
export class OwnerController extends BaseController<Owner> {
  private readonly logger = new Logger(OwnerController.name);

  constructor(protected readonly service: OwnerService) {
    super(service);
  }

  @Get()
  @HttpCode(200)
  @Permissions('VIEW_OWNERS')
  async viewOwners(
    @AuthenticatedUser() user: User,
  ): Promise<BaseResponseDto<Owner>> {
    const owners = await this.service.findAll();
    return new BaseResponseDto(owners);
  }

  @Get(':id')
  @HttpCode(200)
  @Permissions('VIEW_OWNERS')
  async viewOwner(
    @AuthenticatedUser() user: User,
    @Param('id') id: string,
  ): Promise<BaseResponseDto<Owner>> {
    const owner = await this.service.findOwnerById(id, user);
    return new BaseResponseDto(owner);
  }

  @Post()
  @Permissions('CREATE_OWNERS')
  async createOwner(
    @Body() dto: CreateOwnerDto,
    @AuthenticatedUser() user: User,
  ): Promise<BaseResponseDto<Owner>> {
    const owner = await this.service.createOwner(dto, user);
    return new BaseResponseDto(owner);
  }
}
