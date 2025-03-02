import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../services/user.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let userService: UserService;

  beforeAll(() => {
    // Mock environment variable
    process.env.APPLICATION_SECRET_KEY = 'test-secret';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UserService,
          useValue: {
            getUserById: jest.fn(), // Mock getUserById method
          },
        },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    userService = module.get<UserService>(UserService);
  });

  const validatedUser = {
    id: 1,
    first_name: 'crossroad',
    last_name: 'Seho',
    phone: '0712345678',
    email: 'test@example.com',
    phone_verified: false,
    email_verified: false,
    date_created: '2024-08-12T11:35:30.150Z',
    is_active: true
  }

  it('should return the user if found by getUserById', async () => {
    jest.spyOn(userService, 'getUserById').mockResolvedValue(validatedUser);
    const payload = { id: 1, sub: 1, email: 'test@example.com', first_name: 'John', last_name: 'Doe', phone: '123456789' };

    const result = await jwtStrategy.validate(payload);
    expect(result).toEqual(validatedUser);
    expect(userService.getUserById).toHaveBeenCalledWith(payload.id);
  });

  it('should return payload if user is not found', async () => {
    jest.spyOn(userService, 'getUserById').mockResolvedValue(null);

    const payload = { id: 1, sub: 1, email: 'test@example.com', first_name: 'John', last_name: 'Doe', phone: '123456789' };

    const result = await jwtStrategy.validate(payload);
    expect(result).toEqual({
      id: payload.sub,
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      phone: payload.phone,
    });
    expect(userService.getUserById).toHaveBeenCalledWith(payload.id);
  });
});
