import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );
    
    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Log the incoming request and user for debugging
    this.logger.debug(`Checking roles for user: ${JSON.stringify({
      userId: user?.id,
      userRole: user?.role,
      requiredRoles,
      path: request.path,
      method: request.method
    })}`);
    
    // Check if user exists and has a role
    if (!user || !user.role) {
      this.logger.warn('Access denied: No user or role found in request');
      throw new UnauthorizedException('Access denied: Invalid user session');
    }
    
    // Check if user's role is in the required roles
    const hasRole = requiredRoles.some((role) => user.role === role);
    
    if (!hasRole) {
      this.logger.warn(`Access denied: User role ${user.role} not in required roles [${requiredRoles.join(', ')}]`);
      throw new UnauthorizedException('You do not have permission to access this resource');
    }
    
    return true;
  }
}