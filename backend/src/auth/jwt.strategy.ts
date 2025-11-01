import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || JwtStrategy.generateFallbackSecret(),
    });
  }

  private static generateFallbackSecret(): string {
    const secret = require('crypto').randomBytes(64).toString('hex');
    console.log(' Fallback JWT Secret généré pour JwtStrategy');
    return secret;
  }

  private readonly logger = new Logger(JwtStrategy.name);

  async validate(payload: any) {
    try {
      // Log the incoming payload for debugging
      this.logger.debug(`Validating JWT payload: ${JSON.stringify({
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        hasFirstName: !!payload.firstName,
        hasLastName: !!payload.lastName
      })}`);

      // Extract and validate user ID from payload
      const userId = this.extractUserId(payload);
      
      // Create user object from token with only necessary fields
      const user = {
        id: userId, // Only set id once
        email: payload.email || '',
        firstName: payload.firstName || '',
        lastName: payload.lastName || '',
        role: this.validateRole(payload.role),
        isActive: payload.isActive !== false, // Default to true if not specified
        // Add any other necessary fields from the token
      };

      this.logger.debug(`Validated user from JWT: ${JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      })}`);

      return user;
    } catch (error) {
      this.logger.error('JWT Validation Error:', error.stack);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractUserId(payload: any): number {
    // Check for user ID in standard JWT 'sub' claim first, then fall back to other fields
    const userIdStr = payload.sub || payload.id || payload.userId;
    
    if (!userIdStr) {
      this.logger.error('No user identifier found in token payload');
      throw new UnauthorizedException('No user identifier found in token');
    }

    // Convert to number safely
    const userId = Number(userIdStr);
    
    // Check if it's a valid positive integer
    if (!Number.isInteger(userId) || userId <= 0) {
      this.logger.error(`Invalid user ID in token: ${userIdStr}`);
      throw new UnauthorizedException('Invalid user identifier in token');
    }

    return userId;
  }

  private validateRole(role: any): UserRole {
    if (!role || typeof role !== 'string') {
      this.logger.warn(`Invalid role type: ${typeof role}, defaulting to PATIENT`);
      return UserRole.PATIENT;
    }
    
    // Convert to lowercase for case-insensitive comparison
    const normalizedRole = role.toLowerCase();
    
    // Check if the role exists in the UserRole enum
    if (Object.values(UserRole).includes(normalizedRole as UserRole)) {
      return normalizedRole as UserRole;
    }
    
    this.logger.warn(`Unknown role: ${role}, defaulting to PATIENT`);
    return UserRole.PATIENT; // Default to PATIENT if role is invalid
  }
}