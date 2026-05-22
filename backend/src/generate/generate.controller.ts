import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GenerateService } from './generate.service';
import { GenerateScriptDto, GenerateScriptResponseDto } from './dto/generate-script.dto';
import { GenerateImagesDto, GenerateImagesResponseDto } from './dto/generate-images.dto';
import { GenerateAudioDto, GenerateAudioResponseDto } from './dto/generate-audio.dto';
import { GenerateVideoDto, GenerateVideoResponseDto } from './dto/generate-video.dto';

const ANONYMOUS_USER_ID = 'anonymous-user';

@ApiTags('Generate')
@Controller('generate')
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Post('script')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Generate script from story',
    description: 'Takes a story and generates a short-form video script using Claude AI',
  })
  @ApiResponse({
    status: 202,
    description: 'Script generation job queued',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  async generateScript(
    @Body() dto: GenerateScriptDto,
  ): Promise<GenerateScriptResponseDto> {
    return this.generateService.generateScript(ANONYMOUS_USER_ID, dto);
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
  ) {
    return this.generateService.getJobStatus(jobId, ANONYMOUS_USER_ID);
  }

  @Post('images')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
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
  ): Promise<GenerateImagesResponseDto> {
    return this.generateService.generateImages(ANONYMOUS_USER_ID, dto);
  }

  @Post('audio')
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Generate narration audio',
    description: 'Convert script narration to speech using ElevenLabs',
  })
  @ApiResponse({
    status: 202,
    description: 'Audio generation job queued',
  })
  async generateAudio(
    @Body() dto: GenerateAudioDto,
  ): Promise<GenerateAudioResponseDto> {
    return this.generateService.generateAudio(ANONYMOUS_USER_ID, dto);
  }

  @Post('video')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Assemble final video from images and audio',
    description: 'Creates async video assembly job. Returns jobId for polling.',
  })
  @ApiResponse({
    status: 202,
    description: 'Video assembly job created',
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 403, description: 'Unauthorized' })
  async generateVideo(
    @Body() dto: GenerateVideoDto,
  ): Promise<GenerateVideoResponseDto> {
    return this.generateService.generateVideo(ANONYMOUS_USER_ID, dto);
  }
}
