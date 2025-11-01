import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    
    // Log the incoming request for debugging
    this.logger.debug(`Auth check for ${request.method} ${request.url} - Public: ${isPublic}`);
    
    if (isPublic) {
      return true;
    }

    // Add your custom authentication logic here
    // For example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // Log authentication attempt
    this.logger.debug(`Authentication attempt for request ${request.method} ${request.url}`, {
      user: user ? { id: user.id, email: user.email, role: user.role } : 'No user',
      error: err ? err.message : 'No error',
      info: info ? info.message : 'No info'
    });

    // If there's an error or no user, throw an unauthorized exception
    if (err || !user) {
      const errorMessage = this.getErrorMessage(err, info);
      this.logger.warn(`Authentication failed: ${errorMessage}`);
      throw new UnauthorizedException(errorMessage);
    }

    // Log successful authentication
    this.logger.log(`User ${user.id} (${user.email}) authenticated successfully`);
    
    // Attach user to request for further use in controllers
    request.user = user;
    
    return user;
  }

  private getErrorMessage(err: any, info: any): string {
    if (err) {
      return err.message || 'Authentication failed';
    }
    
    if (info) {
      switch (info.name) {
        case 'TokenExpiredError':
          return 'Your session has expired. Please log in again.';
        case 'JsonWebTokenError':
          return 'Invalid token. Please log in again.';
        case 'NotBeforeError':
          return 'Token not yet valid.';
        default:
          return info.message || 'Authentication failed';
      }
    }
    
    return 'Authentication required';
  }
}