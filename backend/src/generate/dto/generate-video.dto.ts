import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateVideoDto {
  @ApiProperty({
    example: 'job_123abc',
    description: 'ID of completed image generation job',
  })
  @IsNotEmpty()
  @IsString()
  imageJobId: string = '';

  @ApiProperty({
    example: 'job_456def',
    description: 'ID of completed audio generation job',
  })
  @IsNotEmpty()
  @IsString()
  audioJobId: string = '';

  @ApiProperty({
    example: 30,
    description: 'Optional video frames per second (default: 30)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  fps?: number;

  @ApiProperty({
    example: '2000k',
    description: 'Optional video bitrate (default: 2000k)',
    required: false,
  })
  @IsOptional()
  @IsString()
  bitrate?: string;
}

export interface GenerateVideoResponseDto {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  createdAt: Date;
}

export interface VideoAssemblyResult {
  videoUrl: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  format: string; // 'mp4'
  generatedAt: Date;
}
