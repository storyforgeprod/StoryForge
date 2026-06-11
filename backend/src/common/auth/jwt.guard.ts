import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

const DEV_USER = {
  userId: 'dev-user',
  email: 'dev@storyforge.local',
  sub: 'dev-user',
};

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    if (process.env.BYPASS_AUTH === 'true') {
      context.switchToHttp().getRequest().user = DEV_USER;
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new Error('Unauthorized');
    }
    return user;
  }
}
