import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PublicKeyService } from '../../services/public-key.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly publicKeyService: PublicKeyService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: async (
        request,
        rawJwtToken,
        done: (err: any, secretOrKey?: string | Buffer) => void,
      ) => {
        try {
          const publicKey = await this.publicKeyService.getPublicKey();
          done(null, publicKey);
        } catch (error) {
          done(error, null);
        }
      },
    });
  }

  async validate(payload: any) {
    if (!payload) {
      throw new UnauthorizedException('Invalid Token');
    }

    const { sub, ...rest } = payload;

    return {
      id: sub,
      ...rest,
    };
  }
}
