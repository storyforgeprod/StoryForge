import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

const DEV_USER = {
  userId: 'dev-user',
  email: 'dev@storyforge.local',
  sub: 'dev-user',
};

const ANONYMOUS_USER = {
  userId: `anon-${Date.now()}`,
  email: `anon-${Date.now()}@storyforge.local`,
  sub: `anon-${Date.now()}`,
};

/**
 * Optional JWT guard - allows JWT authentication but doesn't require it
 * If no JWT provided, allows request with anonymous user
 * Used for generation endpoints that work with or without auth
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    if (process.env.BYPASS_AUTH === 'true') {
      context.switchToHttp().getRequest().user = DEV_USER;
      return true;
    }
    
    // Try to authenticate with JWT
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    // If JWT auth failed but no error was critical, allow with anonymous user
    if (!user && !err) {
      return ANONYMOUS_USER;
    }
    
    // If there's a real error, throw it
    if (err) {
      throw err;
    }
    
    // User was authenticated successfully
    return user || ANONYMOUS_USER;
  }
}
