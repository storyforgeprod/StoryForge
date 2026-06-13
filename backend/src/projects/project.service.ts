import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ProjectResponseDto } from './dto/project-response.dto';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(private readonly prisma: PrismaService) {}

  async finalizeFromVideoJob(
    videoJobId: string,
    userId: string,
    videoUrl: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const videoJob = await tx.job.findUnique({ where: { id: videoJobId } });
      if (!videoJob) throw new Error(`Video job ${videoJobId} not found`);
      if (videoJob.projectId) return;

      const videoMeta = JSON.parse(videoJob.metadata || '{}') as {
        imageJobId: string;
        audioJobId: string;
      };
      const { imageJobId, audioJobId } = videoMeta;
      if (!imageJobId || !audioJobId) {
        throw new Error(
          `Video job ${videoJobId} missing imageJobId or audioJobId in metadata`,
        );
      }

      const imageJob = await tx.job.findUnique({ where: { id: imageJobId } });
      if (!imageJob?.result) {
        throw new Error(`Image job ${imageJobId} not found or has no result`);
      }
      const imageMeta = JSON.parse(imageJob.metadata || '{}') as {
        scriptId: string;
        style: string;
      };
      const imageResult = JSON.parse(imageJob.result) as { imageUrls: string[] };
      const { scriptId, style } = imageMeta;

      const audioJob = await tx.job.findUnique({ where: { id: audioJobId } });
      if (!audioJob?.result) {
        throw new Error(`Audio job ${audioJobId} not found or has no result`);
      }
      const audioResult = JSON.parse(audioJob.result) as {
        audioUrl: string;
        audioLength: number;
      };

      if (!scriptId) throw new Error(`Image job ${imageJobId} missing scriptId in metadata`);
      const scriptJob = await tx.job.findUnique({ where: { id: scriptId } });
      if (!scriptJob) throw new Error(`Script job ${scriptId} not found`);
      const scriptMeta = JSON.parse(scriptJob.metadata || '{}') as {
        story: string;
        targetDuration: number;
      };
      const scriptResult = scriptJob.result
        ? (JSON.parse(scriptJob.result) as { script: string })
        : { script: '' };

      const projectCount = await tx.project.count({ where: { userId } });
      const title = `Story #${projectCount + 1}`;

      const project = await tx.project.create({
        data: {
          userId,
          title,
          storyText: scriptMeta.story || '',
          style: style || 'anime',
          duration: scriptMeta.targetDuration || 60,
          status: 'completed',
        },
      });

      await tx.output.create({
        data: {
          projectId: project.id,
          script: scriptResult.script || '',
          images: imageResult.imageUrls || [],
          audioUrl: audioResult.audioUrl,
          videoUrl,
          duration: audioResult.audioLength || scriptMeta.targetDuration || 60,
          format: 'mp4',
          resolution: '1080x1920',
        },
      });

      await tx.job.updateMany({
        where: { id: { in: [videoJobId, imageJobId, audioJobId, scriptId] } },
        data: { projectId: project.id },
      });

      this.logger.log(
        `[ProjectService] Created project ${project.id} ("${title}") from video job ${videoJobId}`,
      );
    });
  }

  async getProjects(_userId: string): Promise<ProjectResponseDto[]> {
    throw new Error('Not implemented');
  }

  async getProjectById(
    _projectId: string,
    _userId: string,
  ): Promise<ProjectResponseDto> {
    throw new Error('Not implemented');
  }

  private _mapToDto(_project: any): ProjectResponseDto {
    throw new Error('Not implemented');
  }
}
