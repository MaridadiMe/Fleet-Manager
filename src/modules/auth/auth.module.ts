import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt/jwt.strategy';
import { PublicKeyService } from './services/public-key.service';
import { RestClientModule } from '../restclient/restclient.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RestClientModule,
  ],
  controllers: [],
  providers: [JwtStrategy, PublicKeyService],
  exports: [PassportModule],
})
export class AuthModule {}
