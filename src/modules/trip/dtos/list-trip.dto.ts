import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationOptionsDto } from 'src/common/pagination/pagination-options.dto';
import { TRIP_STATUS } from '../enums/trip-status.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListTripsDto extends PaginationOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  status?: TRIP_STATUS;

  @ApiPropertyOptional()
  @IsOptional()
  driverId?: string;
}
