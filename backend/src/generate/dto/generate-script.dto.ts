import { IsString, IsNotEmpty, MaxLength, MinLength, IsOptional, IsNumber, Min, Max, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({
    description: 'Target number of scenes (1-12, default 12)',
    example: 12,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  targetScenes?: number;

  @ApiProperty({
    description: 'Narration tone for script generation',
    example: 'dramatic',
    enum: ['playful', 'dramatic', 'suspenseful', 'energetic'],
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['playful', 'dramatic', 'suspenseful', 'energetic'])
  tone?: string;

  @ApiProperty({
    description: 'Output language for the generated script',
    example: 'en',
    enum: ['en', 'es', 'pt', 'fr'],
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['en', 'es', 'pt', 'fr'])
  language?: string;
}

export class GenerateScriptResponseDto {
  @ApiProperty({ description: 'Job ID for tracking generation status', example: 'job_abc123' })
  jobId!: string;

  @ApiProperty({
    description: 'Current job status',
    enum: ['pending', 'processing', 'completed', 'failed'],
    example: 'pending',
  })
  status!: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiProperty({ description: 'Status message', example: 'Script generation queued' })
  message!: string;

  @ApiProperty({ description: 'Target duration for video', example: 60, required: false })
  targetDuration?: number;

  @ApiProperty({ description: 'Generation timestamp', required: false })
  createdAt?: Date;

  @ApiProperty({
    description: 'Generated script (null if still processing)',
    example: 'Scene 1: Establishing shot...',
    required: false,
  })
  script?: string | null;

  @ApiProperty({ description: 'Error message if job failed', required: false })
  error?: string | null;
}
