import { Injectable } from '@nestjs/common';
import Queue from 'bull';
import Redis from 'ioredis';

export interface GenerationJobData {
  jobId: string; // Prisma Job ID
  userId: string;
  projectId: string | null;
  type: 'script' | 'images' | 'audio' | 'video';
  story?: string; // For script generation
  scriptId?: string; // For images/audio/video (references script job)
  imageDescription?: string; // Optional custom description for images
  voiceId?: string; // Optional ElevenLabs voice ID for audio
  imageJobId?: string; // For video (references image job)
  audioJobId?: string; // For video (references audio job)
  fps?: number; // For video (optional)
  bitrate?: string; // For video (optional)
  _startTime?: number; // For measuring processing time
}

@Injectable()
export class QueueService {
  private generateQueue: Queue.Queue<GenerationJobData>;
  private redis: Redis;

  constructor() {
    // Initialize Redis
    this.redis = new Redis({
      host: process.env.REDIS_URL?.split('@')[1]?.split(':')[0] || 'localhost',
      port: parseInt(process.env.REDIS_URL?.split(':').pop() || '6379'),
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    // Initialize Bull queue
    this.generateQueue = new Queue('generate', {
      redis: {
        host: process.env.REDIS_URL?.split('@')[1]?.split(':')[0] || 'localhost',
        port: parseInt(process.env.REDIS_URL?.split(':').pop() || '6379'),
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    });

    // Event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.generateQueue.on('error', (err) => {
      console.error('[Queue] Error:', err);
    });

    this.generateQueue.on('waiting', (jobId) => {
      console.log(`[Queue] Job ${jobId} waiting`);
    });

    this.generateQueue.on('active', (job) => {
      console.log(`[Queue] Job ${job.id} active`);
    });

    this.generateQueue.on('completed', (job) => {
      console.log(`[Queue] Job ${job.id} completed`);
    });

    this.generateQueue.on('failed', (job, err) => {
      console.error(`[Queue] Job ${job.id} failed:`, err.message);
    });
  }

  /**
   * Add job to queue
   */
  async addGenerationJob(data: GenerationJobData) {
    try {
      const job = await this.generateQueue.add(data, {
        jobId: data.jobId, // Use Prisma Job ID as Bull Job ID
      });
      return job;
    } catch (error) {
      console.error('Error adding job:', error);
      throw error;
    }
  }

  /**
   * Register job processor
   */
  process(
    concurrency: number = 2,
    processor: (job: Queue.Job<GenerationJobData>) => Promise<any>,
  ) {
    return this.generateQueue.process(concurrency, processor);
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string) {
    const job = await this.generateQueue.getJob(jobId);
    if (!job) return null;

    return {
      id: job.id,
      status: await job.getState(),
      progress: job.progress(),
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
    };
  }

  /**
   * Get queue stats
   */
  async getQueueStats() {
    const counts = await this.generateQueue.getJobCounts();
    return {
      waiting: counts.waiting,
      active: counts.active,
      completed: counts.completed,
      failed: counts.failed,
      delayed: counts.delayed,
    };
  }

  /**
   * Clean old jobs (archival)
   */
  async cleanOldJobs(olderThan: number = 24 * 60 * 60 * 1000) {
    // Remove completed jobs older than 24h
    await this.generateQueue.clean(olderThan, 'completed');
    // Remove failed jobs older than 7 days
    await this.generateQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
  }

  /**
   * Graceful shutdown
   */
  async close() {
    await this.generateQueue.close();
    await this.redis.quit();
  }
}
