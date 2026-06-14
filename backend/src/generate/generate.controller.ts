import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { OptionalJwtAuthGuard } from "@/common/auth/optional-jwt.guard";
import { Throttle, SkipThrottle } from "@nestjs/throttler";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { CurrentUser } from "@/common/auth/current-user.decorator";
import { GenerateService } from "./generate.service";
import {
  GenerateScriptDto,
  GenerateScriptResponseDto,
} from "./dto/generate-script.dto";
import {
  GenerateImagesDto,
  GenerateImagesResponseDto,
} from "./dto/generate-images.dto";
import {
  GenerateAudioDto,
  GenerateAudioResponseDto,
} from "./dto/generate-audio.dto";
import {
  GenerateVideoDto,
  GenerateVideoResponseDto,
} from "./dto/generate-video.dto";


@ApiTags("Generate")
@Controller("generate")
@UseGuards(OptionalJwtAuthGuard)
@ApiBearerAuth()
export class GenerateController {
  constructor(private readonly generateService: GenerateService) { }

  @Post("script")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: "Generate script from story",
    description:
      "Takes a story and generates a short-form video script using Claude AI",
  })
  @ApiResponse({
    status: 202,
    description: "Script generation job queued",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  async generateScript(
    @CurrentUser() user: any,
    @Body() dto: GenerateScriptDto,
  ): Promise<GenerateScriptResponseDto> {
    return this.generateService.generateScript(user.sub, dto);
  }

  @Get("job/:jobId")
  @SkipThrottle()
  @ApiOperation({
    summary: "Get job status",
    description: "Retrieve the status and result of a generation job",
  })
  @ApiResponse({
    status: 200,
    description: "Job status retrieved",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  async getJobStatus(
    @CurrentUser() user: any,
    @Param("jobId") jobId: string,
  ) {
    return this.generateService.getJobStatus(jobId, user.sub);
  }

  @Post("images")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: "Generate images from script",
    description:
      "Generate visual assets for video scenes using Azure Foundry Flux.2-pro",
  })
  @ApiResponse({
    status: 202,
    description: "Image generation job queued",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  async generateImages(
    @CurrentUser() user: any,
    @Body() dto: GenerateImagesDto,
  ): Promise<GenerateImagesResponseDto> {
    return this.generateService.generateImages(user.sub, dto);
  }

  @Post("audio")
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: "Generate narration audio",
    description: "Convert script narration to speech using ElevenLabs",
  })
  @ApiResponse({
    status: 202,
    description: "Audio generation job queued",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  async generateAudio(
    @CurrentUser() user: any,
    @Body() dto: GenerateAudioDto,
  ): Promise<GenerateAudioResponseDto> {
    return this.generateService.generateAudio(user.sub, dto);
  }

  @Post("video")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: "Assemble final video from images and audio",
    description: "Creates async video assembly job. Returns jobId for polling.",
  })
  @ApiResponse({
    status: 202,
    description: "Video assembly job created",
  })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 401, description: "Unauthorized - JWT token required" })
  async generateVideo(
    @CurrentUser() user: any,
    @Body() dto: GenerateVideoDto,
  ): Promise<GenerateVideoResponseDto> {
    return this.generateService.generateVideo(user.sub, dto);
  }

  @Post("preset/:type")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Save preset content as a job",
    description: "Saves preset script, images, or audio content directly as a job in the system",
  })
  @ApiResponse({
    status: 201,
    description: "Preset job created successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid preset type or content",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  async savePreset(
    @CurrentUser() user: any,
    @Param("type") type: string,
    @Body() body: { content?: string; jobId?: string },
  ): Promise<{ jobId: string; type: string }> {
    return this.generateService.savePreset(user.sub, type, body);
  }

  @Get("voices")
  @SkipThrottle()
  @ApiOperation({
    summary: "Get available voices for a language",
    description:
      "Returns voices from both Azure TTS and Azure Speech providers",
  })
  @ApiResponse({
    status: 200,
    description: "Available voices retrieved",
  })
  async getAvailableVoices(
    @Query("language") language: string = "en",
  ) {
    return this.generateService.getAvailableVoices(language);
  }

  @Get("voice-sample/:voiceId")
  @SkipThrottle()
  @ApiOperation({
    summary: "Get voice sample for preview",
    description:
      "Generate or retrieve audio sample for a voice to preview before selection",
  })
  @ApiResponse({
    status: 200,
    description: "Voice sample audio generated",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid voice or language",
  })
  async getVoiceSample(
    @Param("voiceId") voiceId: string,
    @Query("language") language: string = "en",
    @Query("provider") provider?: "azure-tts" | "azure-speech",
  ) {
    return this.generateService.getVoiceSample(voiceId, language, provider);
  }

  @Get("voice-availability/:voiceId")
  @SkipThrottle()
  @ApiOperation({
    summary: "Check voice availability for a language",
    description:
      "Verify if a specific voice is available for a language before attempting synthesis. Prevents cascading errors.",
  })
  @ApiResponse({
    status: 200,
    description: "Voice availability check result",
    schema: {
      example: {
        voiceId: "nova",
        language: "en",
        available: true,
        provider: "azure-tts",
        name: "Nova",
        tag: "Energetic",
        message: "Voice nova is available for language en",
      },
    },
  })
  async checkVoiceAvailability(
    @Param("voiceId") voiceId: string,
    @Query("language") language: string = "en",
  ) {
    return this.generateService.checkVoiceAvailability(voiceId, language);
  }
}
