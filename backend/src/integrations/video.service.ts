import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const BUCKET = 'videos';

@Injectable()
export class VideoService implements OnModuleInit {
  private readonly logger = new Logger(VideoService.name);
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }

  async onModuleInit(): Promise<void> {
    await this._verifyFfmpeg();
    await this._ensureVideosBucket();
  }

  private _verifyFfmpeg(): Promise<void> {
    return new Promise((resolve) => {
      const proc = spawn('ffmpeg', ['-version']);
      proc.stdout.once('data', (data: Buffer) => {
        this.logger.log(`[FFmpeg] ${data.toString().split('\n')[0]}`);
      });
      proc.on('error', (err: Error) => {
        this.logger.error(`[FFmpeg] Not found on PATH: ${err.message}`);
        resolve();
      });
      proc.on('close', () => resolve());
    });
  }

  private async _ensureVideosBucket(): Promise<void> {
    const { data: buckets } = await this.supabase.storage.listBuckets();
    if (buckets?.some((b) => b.name === BUCKET)) {
      this.logger.log(`[Supabase] "${BUCKET}" bucket exists`);
      return;
    }
    const { error } = await this.supabase.storage.createBucket(BUCKET, { public: false });
    if (error) {
      this.logger.error(`[Supabase] Failed to create "${BUCKET}" bucket: ${error.message}`);
    } else {
      this.logger.log(`[Supabase] Created "${BUCKET}" bucket`);
    }
  }

  async assembleVideo(
    images: string[],
    audioPath: string,
    metadata: { fps?: number; bitrate?: string; jobId?: string },
  ): Promise<string> {
    const strategy = process.env.VIDEO_ASSEMBLY_STRATEGY ?? 'local';
    this.logger.log(`[VideoService] using strategy: ${strategy}`);
    if (strategy === 'serverless') {
      return this._assembleServerless(images, audioPath, metadata);
    }
    return this._assembleLocal(images, audioPath, metadata);
  }

  private async _assembleLocal(
    images: string[],
    audioPath: string,
    metadata: { fps?: number; bitrate?: string; jobId?: string },
  ): Promise<string> {
    if (!images || images.length === 0) throw new Error('At least one image URL is required');
    if (!audioPath?.trim()) throw new Error('Audio URL is required');

    const jobId = metadata?.jobId || uuidv4();
    const tmpDir = path.join(os.tmpdir(), jobId);
    const startTime = Date.now();

    this.logger.log(`[VideoAssembly] Job ${jobId}: ${images.length} image(s)`);

    try {
      fs.mkdirSync(tmpDir, { recursive: true });

      await Promise.all([
        ...images.map((url, i) => this._downloadFile(url, path.join(tmpDir, `img_${i}.jpg`))),
        this._downloadFile(audioPath, path.join(tmpDir, 'audio.mp3')),
      ]);

      const audioDuration = await this._getAudioDuration(path.join(tmpDir, 'audio.mp3'));
      const secPerImage = audioDuration / images.length;
      const outputPath = path.join(tmpDir, 'output.mp4');

      await this._runFfmpeg(
        this._buildFfmpegArgs(tmpDir, images.length, secPerImage, outputPath, metadata),
      );

      if (!fs.existsSync(outputPath)) throw new Error('FFmpeg did not produce output video');

      const storagePath = `${jobId}/${jobId}.mp4`;
      const fileBuffer = fs.readFileSync(outputPath);

      const { error: uploadError } = await this.supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, { contentType: 'video/mp4', upsert: true });

      if (uploadError) throw new Error(`Supabase upload failed: ${uploadError.message}`);
      this.logger.log(`[VideoAssembly] Uploaded: ${storagePath}`);

      const { data: signedData, error: signedError } = await this.supabase.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, 86400);

      if (signedError || !signedData?.signedUrl) {
        throw new Error(`Failed to create signed URL: ${signedError?.message}`);
      }

      this.logger.log(`[VideoAssembly] Job ${jobId} done in ${Date.now() - startTime}ms`);
      return signedData.signedUrl;
    } finally {
      await this._cleanupDir(tmpDir);
    }
  }

  private async _assembleServerless(
    images: string[],
    audioPath: string,
    metadata: { fps?: number; bitrate?: string; jobId?: string },
  ): Promise<string> {
    const url = process.env.MODAL_FUNCTION_URL;
    if (!url) throw new Error('MODAL_FUNCTION_URL is not set. Cannot use serverless strategy.');

    const response = await fetch(`${url}/assemble`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrls: images,
        audioUrl: audioPath,
        jobId: metadata?.jobId,
        fps: metadata?.fps ?? 30,
        bitrate: metadata?.bitrate ?? '2000k',
      }),
      signal: AbortSignal.timeout(240_000),
    });

    let body: { signedUrl?: string; error?: string } = {};
    try {
      body = (await response.json()) as { signedUrl?: string; error?: string };
    } catch {
      throw new Error(`Serverless function returned non-JSON response [${response.status}]`);
    }

    if (!response.ok) {
      throw new Error(`Serverless assembly failed [${response.status}]: ${body.error ?? 'unknown error'}`);
    }

    if (!body.signedUrl) throw new Error('Serverless function did not return a signedUrl');
    this.logger.log(`[VideoAssembly] Serverless signed URL received for job ${metadata?.jobId}`);
    return body.signedUrl;
  }

  private async _downloadFile(url: string, dest: string): Promise<void> {
    if (url.startsWith('data:')) {
      const base64 = url.replace(/^data:[^;]+;base64,/, '');
      fs.writeFileSync(dest, Buffer.from(base64, 'base64'));
      return;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed [${response.status}]: ${url}`);
    fs.writeFileSync(dest, Buffer.from(await response.arrayBuffer()));
  }

  private _getAudioDuration(audioPath: string): Promise<number> {
    return new Promise((resolve) => {
      const proc = spawn('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        audioPath,
      ]);
      let output = '';
      proc.stdout.on('data', (d: Buffer) => (output += d.toString()));
      proc.on('error', () => resolve(60));
      proc.on('close', () => {
        const d = parseFloat(output.trim());
        resolve(isNaN(d) ? 60 : Math.min(d, 60));
      });
    });
  }

  private _buildFfmpegArgs(
    tmpDir: string,
    numImages: number,
    secPerImage: number,
    outputPath: string,
    options: { fps?: number; bitrate?: string },
  ): string[] {
    const fps = options?.fps ?? 30;
    const bitrate = options?.bitrate ?? '2000k';
    const args: string[] = [];

    for (let i = 0; i < numImages; i++) {
      args.push('-loop', '1', '-t', secPerImage.toFixed(2), '-i', path.join(tmpDir, `img_${i}.jpg`));
    }
    args.push('-i', path.join(tmpDir, 'audio.mp3'));

    const scaleParts = Array.from(
      { length: numImages },
      (_, i) =>
        `[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,` +
        `pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`,
    );
    const concatInputs = Array.from({ length: numImages }, (_, i) => `[v${i}]`).join('');
    scaleParts.push(`${concatInputs}concat=n=${numImages}:v=1:a=0[outv]`);

    args.push(
      '-filter_complex', scaleParts.join(';'),
      '-map', '[outv]',
      '-map', `${numImages}:a`,
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-b:v', bitrate,
      '-c:a', 'aac', '-b:a', '128k',
      '-t', '60',
      '-r', String(fps),
      '-movflags', '+faststart',
      '-y',
      outputPath,
    );

    return args;
  }

  private _runFfmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.log('[FFmpeg] Encoding...');
      const proc = spawn('ffmpeg', args);
      let stderr = '';
      proc.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
      proc.on('error', (err: Error) => reject(new Error(`FFmpeg spawn error: ${err.message}`)));
      proc.on('close', (code: number | null) => {
        if (code !== 0) {
          reject(new Error(`FFmpeg exited code ${code}: ${stderr.slice(-500)}`));
        } else {
          this.logger.log('[FFmpeg] Encoding complete');
          resolve();
        }
      });
    });
  }

  private async _cleanupDir(dir: string): Promise<void> {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        this.logger.log(`[VideoAssembly] Cleaned up ${dir}`);
      }
    } catch (err) {
      this.logger.warn(`[VideoAssembly] Cleanup error: ${err}`);
    }
  }
}
