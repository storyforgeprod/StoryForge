import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SupabaseService } from '../supabase/supabase.service';
import { UsersService } from '../users/users.service';
import { JwtConfigService } from './jwt-config.service';

type SupabaseJwtPayload = {
  sub: string;
  email?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
    private readonly jwtConfig: JwtConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ...jwtConfig.getStrategyConfig(),
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
