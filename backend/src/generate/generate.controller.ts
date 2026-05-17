import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GenerateService } from './generate.service';
import { GenerateScriptDto, GenerateScriptResponseDto } from './dto/generate-script.dto';
import { GenerateImagesDto, GenerateImagesResponseDto } from './dto/generate-images.dto';
import { JwtAuthGuard } from '../common/auth/jwt.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';

@ApiTags('Generate')
@Controller('generate')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Post('script')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate script from story',
    description: 'Takes a story and generates a short-form video script using Claude AI',
  })
  @ApiResponse({
    status: 200,
    description: 'Script generated successfully',
    type: GenerateScriptResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  async generateScript(
    @Body() dto: GenerateScriptDto,
    @CurrentUser() user: any,
  ): Promise<GenerateScriptResponseDto> {
    return this.generateService.generateScript(user.userId, dto);
  }

  @Get('job/:jobId')
  @ApiOperation({
    summary: 'Get job status',
    description: 'Retrieve the status and result of a generation job',
  })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved',
  })
  async getJobStatus(
    @Param('jobId') jobId: string,
    @CurrentUser() user: any,
  ) {
    return this.generateService.getJobStatus(jobId, user.userId);
  }

  @Post('images')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Generate images from script',
    description: 'Generate visual assets for video scenes using Replicate',
  })
  @ApiResponse({
    status: 202,
    description: 'Image generation job queued',
  })
  async generateImages(
    @Body() dto: GenerateImagesDto,
    @CurrentUser() user: any,
  ): Promise<GenerateImagesResponseDto> {
    return this.generateService.generateImages(user.userId, dto);
  }

  @Post('audio')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Generate narration audio',
    description: 'Convert script narration to speech using ElevenLabs',
  })
  @ApiResponse({
    status: 202,
    description: 'Audio generation job queued',
  })
  async generateAudio(@Body() dto: any) {
    // TODO: Implement
    return {
      jobId: 'job_pending',
      status: 'queued',
    };
  }

  @Post('video')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Assemble final video',
    description: 'Combine images, audio, and effects into final video',
  })
  @ApiResponse({
    status: 202,
    description: 'Video assembly job queued',
  })
  async generateVideo(@Body() dto: any) {
    // TODO: Implement
    return {
      jobId: 'job_pending',
      status: 'queued',
    };
  }
}
