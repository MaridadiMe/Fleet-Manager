// src/trips/dto/create-trip.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsDateString,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateTripDto {
  @ApiPropertyOptional()
  @IsString()
  driverId: string;

  @ApiPropertyOptional()
  @IsString()
  driverUserId: string;

  @ApiProperty()
  @IsNumber()
  startLat: number;

  @ApiProperty()
  @IsNumber()
  startLon: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  startAddress?: string;

  @ApiProperty()
  @IsNumber()
  endLat: number;

  @ApiProperty()
  @IsNumber()
  endLon: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endAddress?: string;

  @ApiProperty()
  @IsDateString()
  departureAt: string; // ISO string

  @ApiProperty()
  @IsNumber()
  @Min(1)
  seatsTotal: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  seatsAvailable: number;

  @ApiPropertyOptional()
  @IsOptional()
  price?: number;
}
