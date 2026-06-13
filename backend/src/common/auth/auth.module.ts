import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt.guard';
import { OptionalJwtAuthGuard } from './optional-jwt.guard';
import { JwtConfigService } from './jwt-config.service';
import { GoogleStrategy } from './google.strategy';
import { RolesGuard } from './roles.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { UsersModule } from '../users/users.module';

// Resolve JWT secret once at module load time
const jwtSecret =
  process.env.JWT_SECRET ||
  process.env.SUPABASE_JWT_SECRET ||
  'storyforge-dev-only-insecure-key';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: 604800 }, // 7 days in seconds
    }),
    SupabaseModule,
    UsersModule,
  ],
  providers: [
    JwtConfigService,
    JwtStrategy,
    GoogleStrategy,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    RolesGuard,
    AuthService,
  ],
  controllers: [AuthController],
  exports: [JwtAuthGuard, OptionalJwtAuthGuard, RolesGuard, AuthService, PassportModule, JwtConfigService],
})
export class AuthModule {}
