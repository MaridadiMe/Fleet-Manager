import { Module } from '@nestjs/common';
import { OwnerService } from './services/owner.service';
import { OwnerRepository } from './repositories/owner.repository';
import { OwnerController } from './controllers/owner.controller';
import { RestClientModule } from '../restclient/restclient.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RestClientModule, AuthModule],
  controllers: [OwnerController],
  providers: [OwnerService, OwnerRepository],
  exports: [],
})
export class OwnerModule {}
