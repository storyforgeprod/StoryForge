import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { GenerateModule } from './generate/generate.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { SupabaseModule } from './common/supabase/supabase.module';
import { QueueModule } from './common/queue/queue.module';
import { AuthModule } from './common/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    PrismaModule,
    SupabaseModule,
    QueueModule,
    AuthModule,
    GenerateModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
