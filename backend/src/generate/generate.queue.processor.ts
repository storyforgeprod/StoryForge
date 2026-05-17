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
  imageDescription?: string;
  voiceId?: string;
  _startTime: number;
}

@Processor('generation')
export class GenerateQueueProcessor {
  private readonly logger = new Logger(GenerateQueueProcessor.name);

  constructor(
    private prisma: PrismaService,
    private generateService: GenerateService,
  ) {}

  @Process()
  async processGenerationJob(job: Job<GenerationJobData>) {
    const { jobId, userId, type, story } = job.data;

    this.logger.log(`🔄 Processing ${type} job ${jobId}`);

    try {
      // 1. Mark as processing
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'processing',
          progress: 25,
          startedAt: new Date(),
        },
      });

      let result;

      // 2. Execute based on type
      if (type === 'script') {
        result = await this.generateService.generateScriptContent(userId, {
          story: story || '',
        });
      } else if (type === 'images') {
        result = await this.generateService.generateImageContent(userId, {
          jobId,
          scriptId: job.data.scriptId || '',
        });
      } else if (type === 'audio') {
        result = await this.generateService.generateAudioContent(userId, {
          jobId,
          scriptId: job.data.scriptId || '',
          voiceId: job.data.voiceId,
        });
      } else {
        throw new Error(`Type ${type} not yet implemented`);
      }

      // 3. Mark as completed
      const processingTimeMs = Date.now() - job.data._startTime;

      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 100,
          result: JSON.stringify(result),
          processingTimeMs,
          completedAt: new Date(),
        },
      });

      this.logger.log(`✅ Job ${jobId} completed in ${processingTimeMs}ms`);
      return { success: true, jobId };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`❌ Job ${jobId} failed: ${errorMsg}`);

      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: errorMsg,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }
}
