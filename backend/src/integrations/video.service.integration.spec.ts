// @slow — requires real FFmpeg binary on PATH; skipped automatically if unavailable.
import { Test } from '@nestjs/testing';
import { VideoService } from './video.service';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    storage: {
      listBuckets: jest.fn().mockResolvedValue({ data: [{ name: 'videos' }], error: null }),
      from: () => ({
        upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
        createSignedUrl: jest.fn().mockImplementation((storagePath: string) =>
          Promise.resolve({
            data: {
              signedUrl: `https://supabase.example.com/storage/v1/object/sign/videos/${storagePath}?token=test`,
            },
            error: null,
          }),
        ),
      }),
      createBucket: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
  }),
}));

function hasFfmpeg(): boolean {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const FFMPEG_AVAILABLE = hasFfmpeg();
const describeIf = FFMPEG_AVAILABLE ? describe : describe.skip;

describeIf('VideoService @slow - assembleVideo integration', () => {
  let service: VideoService;
  const fixturesDir = path.join(os.tmpdir(), `sf-test-fixtures-${Date.now()}`);

  beforeAll(async () => {
    fs.mkdirSync(fixturesDir, { recursive: true });

    execSync(
      `ffmpeg -f lavfi -i color=red:size=1080x1920 -frames:v 1 -y "${path.join(fixturesDir, 'test.jpg')}"`,
      { stdio: 'ignore' },
    );
    execSync(
      `ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 2 -y "${path.join(fixturesDir, 'test.mp3')}"`,
      { stdio: 'ignore' },
    );

    const module = await Test.createTestingModule({
      providers: [VideoService],
    }).compile();

    service = module.get<VideoService>(VideoService);
    await service.onModuleInit();
  }, 30_000);

  afterAll(() => {
    fs.rmSync(fixturesDir, { recursive: true, force: true });
  });

  function imageDataUri(): string {
    return `data:image/jpeg;base64,${fs.readFileSync(path.join(fixturesDir, 'test.jpg')).toString('base64')}`;
  }

  function audioDataUri(): string {
    return `data:audio/mpeg;base64,${fs.readFileSync(path.join(fixturesDir, 'test.mp3')).toString('base64')}`;
  }

  it('returns a signed URL for assembled video', async () => {
    const jobId = `test-assemble-${Date.now()}`;

    const result = await service.assembleVideo([imageDataUri()], audioDataUri(), { jobId });

    expect(typeof result).toBe('string');
    expect(result).toMatch(/supabase/);
  }, 120_000);

  it('removes temp dir after successful assembly', async () => {
    const jobId = `test-cleanup-${Date.now()}`;
    const tmpDir = path.join(os.tmpdir(), jobId);

    await service.assembleVideo([imageDataUri()], audioDataUri(), { jobId });

    expect(fs.existsSync(tmpDir)).toBe(false);
  }, 120_000);

  it('removes temp dir even when FFmpeg fails', async () => {
    const jobId = `test-fail-cleanup-${Date.now()}`;
    const tmpDir = path.join(os.tmpdir(), jobId);

    await expect(
      service.assembleVideo(
        ['data:image/jpeg;base64,/9j/AA=='],
        'data:audio/mpeg;base64,AAAA',
        { jobId },
      ),
    ).rejects.toThrow();

    expect(fs.existsSync(tmpDir)).toBe(false);
  }, 30_000);
});
