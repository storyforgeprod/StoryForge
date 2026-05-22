import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
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
    // Configure Bull (Redis) connection using REDIS_URL so producers and
    // consumers share the same Redis instance.
    BullModule.forRoot({
      redis: (() => {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        let urlObj: URL;
        try {
          urlObj = new URL(redisUrl);
        } catch (err) {
          urlObj = new URL('redis://localhost:6379');
        }

        const host = urlObj.hostname || 'localhost';
        const port = parseInt(urlObj.port || '6379', 10) || 6379;
        const isTls = urlObj.protocol === 'rediss:' || urlObj.protocol === 'rediss';

        const redisOptions: any = { host, port };
        if (urlObj.password) redisOptions.password = urlObj.password;
        if (isTls) redisOptions.tls = { servername: host };

        return redisOptions;
      })(),
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
export class AppModule { }
