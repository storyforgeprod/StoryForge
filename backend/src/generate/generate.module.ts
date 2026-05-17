import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { GenerateQueueProcessor } from './generate.queue.processor';
import { ReplicateService } from './replicate.service';
import { ElevenLabsService } from './elevenlabs.service';
import { VideoService } from './video.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuthModule } from '../common/auth/auth.module';
import { QueueModule } from '../common/queue/queue.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    QueueModule,
    BullModule.registerQueue({
      name: 'generation',
    }),
  ],
  controllers: [GenerateController],
  providers: [
    GenerateService,
    GenerateQueueProcessor,
    ReplicateService,
    ElevenLabsService,
    VideoService,
  ],
  exports: [GenerateService, ReplicateService, ElevenLabsService, VideoService],
})
export class GenerateModule {}
