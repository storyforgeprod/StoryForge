import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { GenerateController } from "./generate.controller";
import { GenerateService } from "./generate.service";
import { GenerateQueueProcessor } from "./generate.queue.processor";
import { PrismaModule } from "../common/prisma/prisma.module";
import { QueueModule } from "../common/queue/queue.module";
import { ProjectModule } from "../projects/project.module";
import { AzureOpenAIService } from "../integrations/azure-openai.service";
import { AzureFoundryImageService } from "../integrations/azure-foundry-image.service";
import { ImageService } from "../integrations/image.service";
import { AzureTTSService } from "../integrations/azure-tts.service";
import { AudioGenerationService } from "../integrations/audio-generation.service";
import { VideoService } from "../integrations/video.service";

@Module({
  imports: [
    PrismaModule,
    QueueModule,
    BullModule.registerQueue({
      name: "generation",
    }),
    ProjectModule,
  ],
  controllers: [GenerateController],
  providers: [
    GenerateService,
    GenerateQueueProcessor,
    AzureOpenAIService,
    AzureFoundryImageService,
    ImageService,
    AzureTTSService,
    AudioGenerationService,
    VideoService,
  ],
  exports: [
    GenerateService,
    AzureOpenAIService,
    AzureFoundryImageService,
    ImageService,
    AzureTTSService,
    AudioGenerationService,
    VideoService,
  ],
})
export class GenerateModule {}
