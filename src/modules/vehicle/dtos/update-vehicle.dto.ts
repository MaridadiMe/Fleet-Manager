import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateVehicleDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vehicleId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  driverId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ownerId: string;
}
