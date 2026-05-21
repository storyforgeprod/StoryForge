import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { GenerateQueueProcessor } from './generate.queue.processor';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuthModule } from '../common/auth/auth.module';
import { QueueModule } from '../common/queue/queue.module';
import { AzureOpenAIService } from '../integrations/azure-openai.service';
import { AzureFoundryImageService } from '../integrations/azure-foundry-image.service';
import { ElevenLabsService } from '../integrations/elevenlabs.service';
import { VideoService } from '../integrations/video.service';

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
    AzureOpenAIService,
    AzureFoundryImageService,
    ElevenLabsService,
    VideoService,
  ],
  exports: [GenerateService, AzureOpenAIService, AzureFoundryImageService, ElevenLabsService, VideoService],
})
export class GenerateModule { }
