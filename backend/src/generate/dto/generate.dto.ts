import { IsString, IsNotEmpty, IsArray, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateDto {
  @ApiProperty({
    description: 'Story text to convert',
    example: 'A hero embarks on a quest...',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  story!: string;

  @ApiProperty({
    description: 'Visual style (anime, manga, webtoon, novel)',
    example: 'anime',
  })
  @IsString()
  @IsNotEmpty()
  style!: string;
}

export class GenerateResponseDto {
  @ApiProperty({ description: 'Job ID' })
  jobId!: string;

  @ApiProperty({ description: 'Current status' })
  status!: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiProperty({ description: 'When job was created' })
  createdAt!: Date;
}
