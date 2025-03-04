import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { VehicleType } from '../enums/vehicle-type.enum';
import { VehicleStatus } from '../enums/vehicle-status.enum';
import { CapacityUnit } from '../enums/capacity-unit.enum';

export class CreateVehicleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @ApiProperty({
    enum: VehicleType,
    example: Object.keys(VehicleType),
  })
  @IsEnum(VehicleType)
  @IsNotEmpty()
  type: VehicleType;

  @ApiProperty({
    enum: VehicleStatus,
    example: Object.keys(VehicleStatus),
  })
  @IsEnum(VehicleStatus)
  @IsNotEmpty()
  status: VehicleStatus;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  capacity: number;

  @ApiProperty({
    enum: CapacityUnit,
    example: Object.keys(CapacityUnit),
  })
  @IsEnum(CapacityUnit, { each: true })
  @IsNotEmpty()
  capacityUnit: CapacityUnit;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  driverId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  route: string;
}
