import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SupabaseService } from '../supabase/supabase.service';
import { UsersService } from '../users/users.service';

type SupabaseJwtPayload = {
  sub: string;
  email?: string;
};

// Resolve JWT secret once at module load time (same as in auth.module.ts)
const jwtSecret =
  process.env.JWT_SECRET ||
  process.env.SUPABASE_JWT_SECRET ||
  'storyforge-dev-only-insecure-key';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: SupabaseJwtPayload) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token');
    }

    let email = payload.email;
    let metadata: { full_name?: string; avatar_url?: string; name?: string } | undefined;

    if (!email) {
      const authUser = await this.supabaseService.getAuthUserById(payload.sub);
      if (!authUser?.email) {
        throw new UnauthorizedException('User not found');
      }
      email = authUser.email;
      metadata = authUser.user_metadata as typeof metadata;
    }

    const dbUser = await this.usersService.findOrCreateFromSupabase({
      id: payload.sub,
      email,
      user_metadata: metadata,
    });

    return {
      userId: dbUser.id,
      email: dbUser.email,
      supabaseId: dbUser.supabaseId,
      sub: payload.sub,
    };
  }
}
