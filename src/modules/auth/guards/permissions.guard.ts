import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    //Get User From the request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.permissions) {
      throw new ForbiddenException('User Does Not Have Required Permissions');
    }

    const hasPermission = requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient Permissions');
    }

    return true;
  }
}
