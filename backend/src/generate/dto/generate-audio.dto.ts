import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateAudioDto {
  @ApiProperty({
    example: 'job_123abc',
    description: 'ID of completed script generation job',
  })
  @IsNotEmpty()
  @IsString()
  scriptId: string = '';

  @ApiProperty({
    example: 'EXAVITQu4vr4xnSDxMaL',
    description: 'Optional ElevenLabs voice ID (defaults to Sarah)',
    required: false,
  })
  @IsOptional()
  @IsString()
  voiceId?: string;
}

export interface GenerateAudioResponseDto {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  createdAt: Date;
}

export interface AudioGenerationResult {
  audioUrl: string;
  audioLength: number; // in seconds
  textUsed: string; // First 100 chars for reference
  generatedAt: Date;
}
