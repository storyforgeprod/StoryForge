import { Injectable } from '@nestjs/common';

/**
 * Centralized JWT configuration service
 * Ensures consistent JWT secret across signing and verification
 */
@Injectable()
export class JwtConfigService {
  private readonly secret: string;

  constructor() {
    // Priority: JWT_SECRET > SUPABASE_JWT_SECRET > development default
    this.secret = 
      process.env.JWT_SECRET || 
      process.env.SUPABASE_JWT_SECRET || 
      'storyforge-dev-only-insecure-key';
    
    if (!process.env.JWT_SECRET && !process.env.SUPABASE_JWT_SECRET) {
      console.warn(
        '⚠️  JWT authentication: Neither JWT_SECRET nor SUPABASE_JWT_SECRET is set. ' +
        'Using insecure development key. Set JWT_SECRET in production environment variables.',
      );
    }
  }

  /**
   * Get the JWT secret used for signing and verification
   */
  getSecret(): string {
    return this.secret;
  }

  /**
   * Get JWT module configuration
   */
  getModuleConfig() {
    return {
      secret: this.secret,
      signOptions: { expiresIn: 604800 }, // 7 days in seconds
    };
  }

  /**
   * Get passport-jwt strategy configuration
   */
  getStrategyConfig() {
    return {
      secretOrKey: this.secret,
      ignoreExpiration: false,
      algorithms: ['HS256'],
    };
  }
}
