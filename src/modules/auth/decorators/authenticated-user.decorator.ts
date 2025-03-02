import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../types/user.type';

export const AuthenticatedUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as User;
  },
);
