import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsDateString,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class SearchNearbyTripsDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  pickupLat: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  pickupLon: number;

  @ApiProperty()
  @IsDateString()
  departureFrom: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radiusKm?: number = 5;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(5)
  @Max(50)
  limit?: number = 10;
}
