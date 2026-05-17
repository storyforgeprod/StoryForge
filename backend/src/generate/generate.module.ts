import { Module } from '@nestjs/common';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { ReplicateService } from './replicate.service';
import { ElevenLabsService } from './elevenlabs.service';
import { VideoService } from './video.service';

@Module({
  controllers: [GenerateController],
  providers: [GenerateService, ReplicateService, ElevenLabsService, VideoService],
  exports: [GenerateService, ReplicateService, ElevenLabsService, VideoService],
})
export class GenerateModule {}
