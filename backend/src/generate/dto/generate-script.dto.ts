import { IsString, IsNotEmpty, MaxLength, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum StoryStyle {
  ANIME = 'anime',
  MANGA = 'manga',
  WEBTOON = 'webtoon',
  NOVEL = 'novel',
}

export class GenerateScriptDto {
  @ApiProperty({
    description: 'Story text to convert to script',
    example: 'Once upon a time...',
    minLength: 50,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(50, { message: 'Story must be at least 50 characters' })
  @MaxLength(5000, { message: 'Story must not exceed 5000 characters' })
  story!: string;

  @ApiProperty({
    description: 'Visual style for the generated content',
    enum: StoryStyle,
    example: StoryStyle.ANIME,
  })
  @IsEnum(StoryStyle)
  @IsNotEmpty()
  style!: StoryStyle;

  @ApiProperty({
    description: 'Target video duration in seconds (for pacing)',
    example: 60,
    minimum: 30,
    maximum: 300,
  })
  duration?: number;
}

export class GenerateScriptResponseDto {
  @ApiProperty({
    description: 'Generated script',
    example: 'Scene 1: Establishing shot...',
  })
  script!: string;

  @ApiProperty({
    description: 'Job ID for tracking',
    example: 'job_abc123xyz',
  })
  jobId!: string;

  @ApiProperty({
    description: 'Processing status',
    example: 'processing',
  })
  status!: 'processing' | 'completed' | 'failed';

  @ApiProperty({
    description: 'Timestamp when generation started',
    example: '2026-05-16T10:30:00Z',
  })
  createdAt!: Date;
}
