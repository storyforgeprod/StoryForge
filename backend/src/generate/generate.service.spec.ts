import { Test, TestingModule } from '@nestjs/testing';
import { GenerateService } from './generate.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { QueueService } from '../common/queue/queue.service';
import { AzureOpenAIService } from '../integrations/azure-openai.service';
import { ImageService } from '../integrations/image.service';
import { AudioGenerationService } from '../integrations/audio-generation.service';
import { VideoService } from '../integrations/video.service';

describe('GenerateService - Task 2.1 Prisma Integration', () => {
  let service: GenerateService;
  let prismaMock: any;
  let queueMock: any;

  beforeEach(async () => {
    prismaMock = {
      job: {
        create: jest.fn().mockResolvedValue({
          id: 'clx5a2bcd3e4f5g6h',
          userId: 'test-user-123',
          projectId: null,
          type: 'script',
          status: 'processing',
          progress: 10,
          createdAt: new Date(),
        }),
        update: jest.fn().mockResolvedValue({
          id: 'clx5a2bcd3e4f5g6h',
          status: 'completed',
          progress: 100,
          processingTimeMs: 2500,
        }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'clx5a2bcd3e4f5g6h',
          userId: 'test-user-123',
          status: 'completed',
          progress: 100,
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'test-user-123', email: 'test@test.com' }),
        upsert: jest.fn().mockResolvedValue({ id: 'test-user-123' }),
      },
    };

    queueMock = { addGenerationJob: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: QueueService, useValue: queueMock },
        { provide: AzureOpenAIService, useValue: { generateScript: jest.fn() } },
        { provide: ImageService, useValue: { generateImages: jest.fn() } },
        { provide: AudioGenerationService, useValue: { generateAudio: jest.fn() } },
        { provide: VideoService, useValue: { assembleVideo: jest.fn() } },
      ],
    }).compile();

    service = module.get<GenerateService>(GenerateService);
  });

  describe('Task 2.1 - Prisma Integration', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have generateScript method', () => {
      expect(service.generateScript).toBeDefined();
    });

    it('should have getJobStatus method', () => {
      expect(service.getJobStatus).toBeDefined();
    });

    it('should inject PrismaService', () => {
      expect(service['prisma']).toBeDefined();
    });

    it('passes tone to queue job when provided', async () => {
      const dto = { story: 'a'.repeat(100), tone: 'dramatic', targetDuration: 30, targetScenes: 5 };
      await service.generateScript('test-user-123', dto);
      expect(queueMock.addGenerationJob).toHaveBeenCalledWith(
        expect.objectContaining({ tone: 'dramatic' }),
      );
    });
  });
});
