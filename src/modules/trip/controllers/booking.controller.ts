import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from 'src/modules/auth/decorators/authenticated-user.decorator';
import { Permissions } from 'src/modules/auth/decorators/permissions.decorator';
import { User } from 'src/modules/auth/types/user.type';
import { BookTripDto } from '../dtos/book-trip.dto';
import { BookingService } from '../services/booking.service';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

@Controller('bookings')
@ApiTags('Bookings')
@ApiBearerAuth()
export class BookingController {
  // Booking controller methods will be implemented here
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions()
  async createBooking(
    @AuthenticatedUser() user: User,
    @Body() payload: BookTripDto,
  ) {
    const booking = await this.bookingService.create(user, payload);
    return new BaseResponseDto(booking);
  }
}
