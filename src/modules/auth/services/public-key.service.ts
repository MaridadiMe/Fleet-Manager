import {
  Injectable,
  Logger,
  OnModuleInit,
  RequestMethod,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RestclientService } from 'src/modules/restclient/restclient.service';

@Injectable()
export class PublicKeyService {
  private publicKey: string;

  private readonly redisClient: any;
  private readonly logger = new Logger(PublicKeyService.name);

  constructor(
    private readonly restClient: RestclientService,
    private readonly configService: ConfigService,
  ) {}

  async getPublicKey(): Promise<string> {
    if (!this.publicKey) {
      this.publicKey = await this.getPublicKeyFromIamServer();
    }
    return this.publicKey;
  }

  async getPublicKeyFromIamServer(): Promise<string> {
    try {
      const iamBaseUrl = this.configService.get('IAM_BASE_URL');
      const pKeyEndpoint = this.configService.get('PKEY_ENDPOINT');
      return (await this.restClient.request({
        url: `${iamBaseUrl}/${pKeyEndpoint}`,
        method: RequestMethod.GET,
      })) as string;
    } catch (error) {
      this.logger.error(`Error fetching public key: ${error}`);
    }
  }
}
