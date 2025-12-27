import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class BookTripDto {
  @ApiProperty()
  @IsString()
  tripId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  seats: number;
}
