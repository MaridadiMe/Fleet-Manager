import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
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
import { BookTripDto } from '../dtos/book-trip.dto';
import { SearchNearbyTripsDto } from '../dtos/search-nearby-trips.dto';
import { PublicRoute } from 'src/modules/auth/decorators/public-route.decorator';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { PaymentData } from '../types/payment-data.type';

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

  @Get('nearby')
  @HttpCode(HttpStatus.OK)
  @Permissions()
  async getNearbyTrips(@Query() dto: SearchNearbyTripsDto) {
    const trips = await this.service.findNearbyTrips(dto, {} as User);
    return new BaseResponseDto(trips);
  }

  @Post(':tripId/bookings')
  @Permissions()
  async bookTrip(
    @AuthenticatedUser() user: User,
    @Body() payload: BookTripDto,
  ) {
    const booking = await this.service.bookTrip(user, payload);
    return new BaseResponseDto(booking);
  }

  @Delete(':tripId/bookings/:bookingId')
  @Permissions()
  async cancelTrip(
    @AuthenticatedUser() user: User,
    @Param('tripId') tripId: string,
    @Param('bookingId') bookingId: string,
  ) {
    const booking = await this.service.cancelTrip(user, tripId, bookingId);
    return new BaseResponseDto(booking);
  }

  @Post(':tripId/bookings/:bookingId')
  @Permissions()
  async payForBooking(
    @AuthenticatedUser() user: User,
    @Param('bookingId') bookingId: string,
    @Query('paymentMobileNumber') paymentMobileNumber: string,
    @Query('tripId') tripId: string,
  ) {
    const booking = await this.service.payForBooking(
      user,
      paymentMobileNumber,
      tripId,
      bookingId,
    );
    return new BaseResponseDto(booking);
  }

  @EventPattern('payment.completed.sfms')
  async getNotifications(
    @Payload() data: PaymentData,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    Logger.log(`Received payment notification: ${JSON.stringify(data)}`);
    await this.service.handleBookingPayment(data);

    channel.ack(originalMsg);
  }
}
