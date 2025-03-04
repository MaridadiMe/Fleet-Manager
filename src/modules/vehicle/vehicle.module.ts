import { Module } from '@nestjs/common';
import { VehicleController } from './controllers/vehicle.controller';
import { VehicleRepository } from './repositories/vehicle.repository';
import { VehicleService } from './services/vehicle.service';
import { DriverModule } from '../driver/driver.module';

@Module({
  imports: [DriverModule],
  providers: [VehicleRepository, VehicleService],
  controllers: [VehicleController],
  exports: [],
})
export class VehicleModule {}
