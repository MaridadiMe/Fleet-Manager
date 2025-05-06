import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt/jwt.strategy';
import { PublicKeyService } from './services/public-key.service';
import { RestClientModule } from '../restclient/restclient.module';
import { PassportModule } from '@nestjs/passport';
import { UserService } from './services/user.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RestClientModule,
  ],
  controllers: [],
  providers: [JwtStrategy, PublicKeyService, UserService],
  exports: [PassportModule, UserService],
})
export class AuthModule {}
