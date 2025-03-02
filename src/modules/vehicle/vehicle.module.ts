import { Module } from '@nestjs/common';
import { VehicleController } from './controllers/vehicle.controller';
import { VehicleRepository } from './repositories/vehicle.repository';
import { VehicleService } from './services/vehicle.service';

@Module({
  imports: [],
  providers: [VehicleRepository, VehicleService],
  controllers: [VehicleController],
  exports: [],
})
export class VehicleModule {}
