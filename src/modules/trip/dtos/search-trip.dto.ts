// trips/dto/search-trips.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsDateString } from 'class-validator';

export class SearchTripsDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  pickupLat: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  pickupLon: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  dropLat: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  dropLon: number;

  @ApiProperty()
  @IsDateString()
  departureFrom: string;

  @ApiProperty()
  @IsDateString()
  departureTo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radiusKm?: number = 5;
}
