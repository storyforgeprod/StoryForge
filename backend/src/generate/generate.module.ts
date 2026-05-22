import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { GenerateQueueProcessor } from './generate.queue.processor';
import { PrismaModule } from '../common/prisma/prisma.module';
import { QueueModule } from '../common/queue/queue.module';
import { ReplicateService } from '../integrations/replicate.service';
import { ElevenLabsService } from '../integrations/elevenlabs.service';
import { VideoService } from '../integrations/video.service';

@Module({
  imports: [
    PrismaModule,
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
