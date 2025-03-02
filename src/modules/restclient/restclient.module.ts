import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { RestclientService } from './restclient.service';

@Module({
  imports: [HttpModule],
  providers: [RestclientService],
  exports: [RestclientService],
})
export class RestClientModule {}
