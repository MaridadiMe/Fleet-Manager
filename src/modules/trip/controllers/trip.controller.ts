import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { TripService } from '../services/trip.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from 'src/modules/auth/decorators/permissions.decorator';
import { CreateTripDto } from '../dtos/create-trip.dto';
import { AuthenticatedUser } from 'src/modules/auth/decorators/authenticated-user.decorator';
import { User } from 'src/modules/auth/types/user.type';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

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
}
