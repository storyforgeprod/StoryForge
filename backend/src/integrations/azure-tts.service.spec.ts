import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AzureTTSService } from './azure-tts.service';

const mockConfig = {
  get: jest.fn((key: string) => {
    switch (key) {
      case 'AZURE_OPENAI_ENDPOINT': return 'https://example.openai.azure.com';
      case 'AZURE_OPENAI_API_KEY': return 'test-key';
      case 'AZURE_OPENAI_API_VERSION': return '2024-05-01-preview';
      case 'AZURE_OPENAI_DEPLOYMENT_TTS': return 'gpt-4o-mini-tts';
      default: return undefined;
    }
  }),
};

describe('AzureTTSService', () => {
  let service: AzureTTSService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AzureTTSService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AzureTTSService>(AzureTTSService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('returns base64 data URL on success', async () => {
    const fakeBuffer = Buffer.from('fake-mp3-data');
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(fakeBuffer.buffer),
    } as any);

    const result = await service.synthesize('Hello world', 'alloy');

    expect(result).toMatch(/^data:audio\/mpeg;base64,/);
  });

  it('throws on empty text', async () => {
    await expect(service.synthesize('', 'alloy')).rejects.toThrow('Text cannot be empty');
  });

  it('throws on whitespace-only text', async () => {
    await expect(service.synthesize('   ', 'alloy')).rejects.toThrow('Text cannot be empty');
  });

  it('throws on API error response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Bad request'),
    } as any);

    await expect(service.synthesize('Hello', 'alloy')).rejects.toThrow('Azure TTS API failed: 400');
  });
});
