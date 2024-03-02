import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class UserRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return roles.includes(user.role);
  }
}
