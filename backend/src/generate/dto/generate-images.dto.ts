import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum StoryStyle {
  BOLD_COMIC   = 'bold-comic',
  SOFT_CARTOON = 'soft-cartoon',
  RETRO_POP    = 'retro-pop',
  MANGA_INK    = 'manga-ink',
  STORYBOOK    = 'storybook',
  TOON_3D      = '3d-toon',
}

export class GenerateImagesDto {
  @ApiProperty({
    description: 'Job ID from previous script generation',
    example: 'uuid-script-job-12345',
  })
  @IsString()
  @IsNotEmpty()
  scriptId: string = '';

  @ApiProperty({
    description: 'Visual style for image generation',
    enum: StoryStyle,
    example: StoryStyle.BOLD_COMIC,
  })
  @IsEnum(StoryStyle)
  @IsNotEmpty()
  style!: StoryStyle;

  @ApiProperty({
    description: 'Optional custom description for image generation',
    example: 'A futuristic city at sunset with neon lights',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(10, 500)
  imageDescription?: string;
}

export interface GenerateImagesResponseDto {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  createdAt: Date;
}

export interface ImageGenerationResult {
  imageUrls: string[];
  prompt: string;
  generatedAt: Date;
}
