import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { GenerateService } from './generate.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { Logger } from '@nestjs/common';

interface GenerationJobData {
  jobId: string;
  userId: string;
  projectId: string | null;
  type: 'script' | 'images' | 'audio' | 'video';
  story?: string;
  scriptId?: string;
  style?: string;
  imageDescription?: string;
  voiceId?: string;
  imageJobId?: string;
  audioJobId?: string;
  fps?: number;
  bitrate?: string;
  _startTime: number;
}

@Processor('generation')
export class GenerateQueueProcessor {
  private readonly logger = new Logger(GenerateQueueProcessor.name);

  constructor(
    private prisma: PrismaService,
    private generateService: GenerateService,
  ) {
    this.logger.log('✅ Queue processor initialized for "generation" queue');
  }

  @Process({ concurrency: 1 })
  async processGenerationJob(job: Job<GenerationJobData>) {
    const { jobId, userId, type, story } = job.data;
    const queueWaitTime = Date.now() - job.data._startTime;

    this.logger.log(`🔄 [${type.toUpperCase()}] Processing job ${jobId} (queued: ${queueWaitTime}ms)`);

    try {
      // 1. Mark as processing
      const dbUpdateStart = Date.now();
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'processing',
          progress: 25,
          startedAt: new Date(),
        },
      });
      this.logger.debug(`[${type.toUpperCase()}] DB update: ${Date.now() - dbUpdateStart}ms`);

      let result;
      const executionStart = Date.now();

      // 2. Execute based on type
      if (type === 'script') {
        this.logger.log(`[SCRIPT] 📝 Generating script from story (${story?.length || 0} chars)`);
        result = await this.generateService.generateScriptContent(userId, {
          story: story || '',
        });
        this.logger.log(`[SCRIPT] ✓ Generated script`);
      } else if (type === 'images') {
        this.logger.log(`[IMAGES] 🖼️  Generating ${job.data.style || 'default'} style images`);
        result = await this.generateService.generateImageContent(userId, {
          jobId,
          scriptId: job.data.scriptId || '',
          style: job.data.style,
        });
        const imageUrls = Array.isArray(result?.imageUrls) ? result.imageUrls : [];
        this.logger.log(`[IMAGES] ✓ Generated ${imageUrls.length} images`);
      } else if (type === 'audio') {
        this.logger.log(`[AUDIO] 🔊 Generating audio (voice: ${job.data.voiceId || 'default'})`);
        result = await this.generateService.generateAudioContent(userId, {
          jobId,
          scriptId: job.data.scriptId || '',
          voiceId: job.data.voiceId,
        });
        this.logger.log(`[AUDIO] ✓ Generated audio`);
      } else if (type === 'video') {
        this.logger.log(`[VIDEO] 🎬 Assembling video (${job.data.fps || 30}fps, ${job.data.bitrate || '2000k'})`);
        result = await this.generateService.generateVideoContent(userId, {
          jobId,
          imageJobId: job.data.imageJobId || '',
          audioJobId: job.data.audioJobId || '',
          fps: job.data.fps,
          bitrate: job.data.bitrate,
        });
        this.logger.log(`[VIDEO] ✓ Video assembled`);
      } else {
        throw new Error(`Type ${type} not yet implemented`);
      }

      const executionTimeMs = Date.now() - executionStart;

      // 3. Mark as completed
      const totalTimeMs = Date.now() - job.data._startTime;
      const dbCompleteStart = Date.now();

      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 100,
          result: JSON.stringify(result),
          processingTimeMs: executionTimeMs,
          completedAt: new Date(),
        },
      });
      
      this.logger.log(
        `✅ [${type.toUpperCase()}] Job ${jobId} COMPLETE ⏱️  (exec: ${executionTimeMs}ms, db: ${Date.now() - dbCompleteStart}ms, total: ${totalTimeMs}ms)`,
      );
      return { success: true, jobId, executionTimeMs };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const totalTimeMs = Date.now() - job.data._startTime;

      this.logger.error(`❌ [${type.toUpperCase()}] Job ${jobId} FAILED after ${totalTimeMs}ms: ${errorMsg}`);

      try {
        await this.prisma.job.update({
          where: { id: jobId },
          data: {
            status: 'failed',
            error: errorMsg,
            completedAt: new Date(),
          },
        });
      } catch (dbErr) {
        this.logger.error(`Failed to update job status in DB: ${dbErr}`);
      }

      throw error;
    }
  }
}
