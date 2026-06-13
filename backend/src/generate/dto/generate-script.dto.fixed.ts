import { IsString, IsNotEmpty, MaxLength, MinLength, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum StoryStyle {
  BOLD_COMIC   = 'bold-comic',
  SOFT_CARTOON = 'soft-cartoon',
  RETRO_POP    = 'retro-pop',
  MANGA_INK    = 'manga-ink',
  STORYBOOK    = 'storybook',
  TOON_3D      = '3d-toon',
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
    example: StoryStyle.BOLD_COMIC,
  })
  @IsEnum(StoryStyle)
  @IsNotEmpty()
  style!: StoryStyle;

  @ApiProperty({
    description: 'Target video duration in seconds (30-120s, default 60s)',
    example: 60,
    minimum: 30,
    maximum: 120,
  })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(120)
  targetDuration?: number;
}

export class GenerateScriptResponseDto {
  @ApiProperty({
    description: 'Job ID for tracking generation status',
    example: 'job_abc123',
  })
  jobId!: string;

  @ApiProperty({
    description: 'Current job status',
    enum: ['pending', 'processing', 'completed', 'failed'],
    example: 'pending',
  })
  status!: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiProperty({
    description: 'Status message',
    example: 'Script generation queued',
  })
  message!: string;

  @ApiProperty({
    description: 'Target duration for video',
    example: 60,
    required: false,
  })
  targetDuration?: number;

  @ApiProperty({
    description: 'Generation timestamp',
    required: false,
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Generated script (null if still processing)',
    example: 'Scene 1: Establishing shot...',
    required: false,
  })
  script?: string | null;

  @ApiProperty({
    description: 'Error message if job failed',
    required: false,
  })
  error?: string | null;
}
