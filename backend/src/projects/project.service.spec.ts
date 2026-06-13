import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectService } from './project.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let prismaMock: any;

  const VIDEO_JOB = {
    id: 'vid-1',
    projectId: null,
    userId: 'user-1',
    metadata: JSON.stringify({ imageJobId: 'img-1', audioJobId: 'aud-1' }),
  };
  const IMAGE_JOB = {
    id: 'img-1',
    metadata: JSON.stringify({ scriptId: 'scr-1', style: 'bold-comic' }),
    result: JSON.stringify({ imageUrls: ['https://img.jpg'] }),
  };
  const AUDIO_JOB = {
    id: 'aud-1',
    result: JSON.stringify({ audioUrl: 'https://audio.mp3', audioLength: 45 }),
  };
  const SCRIPT_JOB = {
    id: 'scr-1',
    metadata: JSON.stringify({ story: 'A great story', targetDuration: 60 }),
    result: JSON.stringify({ script: 'Scene 1: Test' }),
  };

  beforeEach(async () => {
    prismaMock = {
      job: {
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 4 }),
      },
      project: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'proj-1', title: 'Story #1' }),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      output: {
        create: jest.fn().mockResolvedValue({ id: 'out-1' }),
      },
      $transaction: jest.fn().mockImplementation(
        async (fn: (tx: any) => Promise<any>) => fn(prismaMock),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  describe('finalizeFromVideoJob', () => {
    it('creates Project and Output when video job completes', async () => {
      prismaMock.job.findUnique
        .mockResolvedValueOnce(VIDEO_JOB)
        .mockResolvedValueOnce(IMAGE_JOB)
        .mockResolvedValueOnce(AUDIO_JOB)
        .mockResolvedValueOnce(SCRIPT_JOB);

      await service.finalizeFromVideoJob('vid-1', 'user-1', 'https://video.mp4');

      expect(prismaMock.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            title: 'Story #1',
            style: 'bold-comic',
            status: 'completed',
          }),
        }),
      );
      expect(prismaMock.output.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            videoUrl: 'https://video.mp4',
            audioUrl: 'https://audio.mp3',
            images: ['https://img.jpg'],
          }),
        }),
      );
      expect(prismaMock.job.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['vid-1', 'img-1', 'aud-1', 'scr-1'] } },
          data: { projectId: 'proj-1' },
        }),
      );
    });

    it('returns early if videoJob.projectId is already set (idempotency)', async () => {
      prismaMock.job.findUnique.mockResolvedValueOnce({
        ...VIDEO_JOB,
        projectId: 'existing-proj',
      });

      await service.finalizeFromVideoJob('vid-1', 'user-1', 'https://video.mp4');

      expect(prismaMock.project.create).not.toHaveBeenCalled();
    });

    it('throws if video job is not found', async () => {
      prismaMock.job.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.finalizeFromVideoJob('vid-1', 'user-1', 'https://video.mp4'),
      ).rejects.toThrow();
    });

    it('throws if image job is not found', async () => {
      prismaMock.job.findUnique
        .mockResolvedValueOnce(VIDEO_JOB)
        .mockResolvedValueOnce(null);

      await expect(
        service.finalizeFromVideoJob('vid-1', 'user-1', 'https://video.mp4'),
      ).rejects.toThrow();
    });

    it('throws if image job has no result', async () => {
      const IMAGE_JOB_NO_RESULT = { ...IMAGE_JOB, result: null };
      prismaMock.job.findUnique
        .mockResolvedValueOnce(VIDEO_JOB)
        .mockResolvedValueOnce(IMAGE_JOB_NO_RESULT);

      await expect(
        service.finalizeFromVideoJob('vid-1', 'user-1', 'https://video.mp4'),
      ).rejects.toThrow();
    });
  });

  describe('getProjects', () => {
    it('returns empty array when user has no projects', async () => {
      prismaMock.project.findMany.mockResolvedValue([]);

      const result = await service.getProjects('user-1');

      expect(result).toEqual([]);
    });

    it('returns mapped DTOs for user projects', async () => {
      prismaMock.project.findMany.mockResolvedValue([
        {
          id: 'proj-1',
          title: 'Story #1',
          style: 'bold-comic',
          duration: 60,
          status: 'completed',
          createdAt: new Date('2026-06-12'),
          outputs: [
            {
              videoUrl: 'https://video.mp4',
              audioUrl: 'https://audio.mp3',
              images: ['https://img.jpg'],
              script: 'Scene 1: Test',
              duration: 45,
            },
          ],
        },
      ]);

      const result = await service.getProjects('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'proj-1',
        title: 'Story #1',
        output: expect.objectContaining({
          videoUrl: 'https://video.mp4',
          audioUrl: 'https://audio.mp3',
        }),
      });
    });
  });

  describe('getProjectById', () => {
    it('returns project DTO when found and owned by user', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        userId: 'user-1',
        title: 'Story #1',
        style: 'bold-comic',
        duration: 60,
        status: 'completed',
        createdAt: new Date('2026-06-12'),
        outputs: [],
      });

      const result = await service.getProjectById('proj-1', 'user-1');

      expect(result.id).toBe('proj-1');
      expect(result.output).toBeNull();
    });

    it('throws NotFoundException when project is not found', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);

      await expect(
        service.getProjectById('missing', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when project belongs to another user', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        userId: 'other-user',
        outputs: [],
      });

      await expect(
        service.getProjectById('proj-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
