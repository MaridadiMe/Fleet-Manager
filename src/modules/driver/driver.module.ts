import { Module } from '@nestjs/common';
import { DriverController } from './controllers/driver.controller';
import { DriverRepository } from './repositories/driver.repository';
import { DriverService } from './services/driver.service';
import { RestClientModule } from '../restclient/restclient.module';

@Module({
  imports: [RestClientModule],
  controllers: [DriverController],
  providers: [DriverRepository, DriverService],
  exports: [DriverRepository],
})
export class DriverModule {}
