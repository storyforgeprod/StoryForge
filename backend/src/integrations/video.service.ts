import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execPromise = promisify(exec);

interface VideoAssemblyOptions {
  duration?: number; // seconds
  fps?: number; // frames per second
  bitrate?: string; // video bitrate
}

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly outputDir = process.env.VIDEO_OUTPUT_DIR || '/tmp/storyforge-videos';

  constructor() {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async assembleVideo(
    imageUrls: string[],
    audioUrl: string,
    options?: VideoAssemblyOptions,
  ): Promise<string> {
    if (!imageUrls || imageUrls.length === 0) {
      throw new Error('At least one image is required');
    }

    if (!audioUrl || audioUrl.trim().length === 0) {
      throw new Error('Audio URL is required');
    }

    const videoId = uuidv4();
    const outputPath = path.join(this.outputDir, `${videoId}.mp4`);

    try {
      // 1. Download image and audio files
      const imagePath = await this._downloadImage(imageUrls[0], videoId);
      const audioPath = await this._downloadAudio(audioUrl, videoId);

      // 2. Get audio duration
      const duration = await this._getAudioDuration(audioPath);

      // 3. Build FFmpeg command for video assembly
      const ffmpegCmd = this._buildFFmpegCommand(
        imagePath,
        audioPath,
        outputPath,
        duration,
        options,
      );

      // 4. Execute FFmpeg
      this.logger.log(`🎬 Assembling video: ${ffmpegCmd}`);
      await execPromise(ffmpegCmd, { timeout: 300000 }); // 5 min timeout

      // 5. Verify output exists
      if (!fs.existsSync(outputPath)) {
        throw new Error('FFmpeg did not produce output video');
      }

      // 6. Return video URL (for now, return local path; in production, upload to storage)
      return `file://${outputPath}`;
    } catch (error) {
      this.logger.error('FFmpeg error:', error);
      // Cleanup on error
      await this._cleanup(videoId);
      throw error;
    }
  }

  private async _downloadImage(
    imageUrl: string,
    videoId: string,
  ): Promise<string> {
    const imagePath = path.join(this.outputDir, `${videoId}_image.png`);

    // If imageUrl is base64 (from local generation)
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(imagePath, Buffer.from(base64Data, 'base64'));
      return imagePath;
    }

    // If imageUrl is HTTP(S), download it
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(imagePath, Buffer.from(arrayBuffer));
    return imagePath;
  }

  private async _downloadAudio(audioUrl: string, videoId: string): Promise<string> {
    const audioPath = path.join(this.outputDir, `${videoId}_audio.mp3`);

    // If audioUrl is base64 (from ElevenLabs)
    if (audioUrl.startsWith('data:')) {
      const base64Data = audioUrl.replace(/^data:audio\/\w+;base64,/, '');
      fs.writeFileSync(audioPath, Buffer.from(base64Data, 'base64'));
      return audioPath;
    }

    // If audioUrl is HTTP(S), download it
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(audioPath, Buffer.from(arrayBuffer));
    return audioPath;
  }

  private async _getAudioDuration(audioPath: string): Promise<number> {
    try {
      const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noprint_wrappers=1 "${audioPath}"`;
      const { stdout } = await execPromise(cmd);
      return parseFloat(stdout.trim());
    } catch (error) {
      this.logger.warn('Could not get audio duration, using default 60s');
      return 60; // Default fallback
    }
  }

  private _buildFFmpegCommand(
    imagePath: string,
    audioPath: string,
    outputPath: string,
    duration: number,
    options?: VideoAssemblyOptions,
  ): string {
    const fps = options?.fps || 30;
    const bitrate = options?.bitrate || '2000k';
    const videoWidth = 1080;
    const videoHeight = 1920; // YouTube Shorts vertical format

    // FFmpeg command:
    // - scale image to vertical format (1080x1920)
    // - loop image for audio duration
    // - combine with audio
    // - output as MP4 (H.264)
    return (
      `ffmpeg -loop 1 -i "${imagePath}" ` +
      `-i "${audioPath}" ` +
      `-c:v libx264 -preset fast ` +
      `-vf "scale=${videoWidth}:${videoHeight}:force_original_aspect_ratio=decrease,pad=${videoWidth}:${videoHeight}:(ow-iw)/2:(oh-ih)/2" ` +
      `-c:a aac -b:a 128k ` +
      `-t ${duration} ` +
      `-y "${outputPath}" 2>&1`
    );
  }

  private async _cleanup(videoId: string): Promise<void> {
    try {
      const files = [
        path.join(this.outputDir, `${videoId}_image.png`),
        path.join(this.outputDir, `${videoId}_audio.mp3`),
        path.join(this.outputDir, `${videoId}.mp4`),
      ];

      for (const file of files) {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      }
    } catch (error) {
      this.logger.warn(`Cleanup error for ${videoId}:`, error);
    }
  }
}
