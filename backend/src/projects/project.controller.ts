import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt.guard';
import { CurrentUser } from '@/common/auth/current-user.decorator';
import { ProjectService } from './project.service';
import { ProjectResponseDto } from './dto/project-response.dto';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'List user projects' })
  @ApiResponse({ status: 200, description: 'Projects retrieved' })
  async getProjects(@CurrentUser() user: any): Promise<ProjectResponseDto[]> {
    return this.projectService.getProjects(user.sub);
  }

  @Get(':id')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProjectById(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<ProjectResponseDto> {
    return this.projectService.getProjectById(id, user.sub);
  }
}
