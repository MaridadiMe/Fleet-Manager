import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { TripService } from '../services/trip.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from 'src/modules/auth/decorators/permissions.decorator';
import { CreateTripDto } from '../dtos/create-trip.dto';
import { AuthenticatedUser } from 'src/modules/auth/decorators/authenticated-user.decorator';
import { User } from 'src/modules/auth/types/user.type';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { SearchTripsDto } from '../dtos/search-trip.dto';
import { ListTripsDto } from '../dtos/list-trip.dto';
import { BasePaginatedResponseDto } from 'src/common/dto/base-paginated-response.dto';

@Controller('trips')
@ApiTags('Trips')
@ApiBearerAuth()
export class TripController {
  constructor(private readonly service: TripService) {}

  @Post()
  @Permissions('CREATE_TRIPS')
  async createTrip(
    @Body() payload: CreateTripDto,
    @AuthenticatedUser() user: User,
  ) {
    const trip = await this.service.createTrip(payload, user);
    return new BaseResponseDto(trip, HttpStatus.CREATED);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions('VIEW_TRIPS')
  async getAllTrips(
    @Query() dto: ListTripsDto,
    @AuthenticatedUser() user: User,
  ) {
    const result = await this.service.listTrips(dto, user);
    return new BasePaginatedResponseDto(result.items, result.meta);
  }

  @Get('mine')
  @HttpCode(HttpStatus.OK)
  @Permissions()
  async getUserTrips(@AuthenticatedUser() user: User) {
    const result = await this.service.getUserTrips(user);
    return new BasePaginatedResponseDto(result.items, result.meta);
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @Permissions()
  async matchTrips(
    @Query() dto: SearchTripsDto,
    @AuthenticatedUser() user: User,
  ) {
    const trips = await this.service.searchTrips(dto, user);
    return new BaseResponseDto(trips);
  }
}
