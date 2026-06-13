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

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (jwtConfig: JwtConfigService) => jwtConfig.getModuleConfig(),
      inject: [JwtConfigService],
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
