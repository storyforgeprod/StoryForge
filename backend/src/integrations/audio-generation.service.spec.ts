import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AudioGenerationService } from './audio-generation.service';
import { AzureTTSService } from './azure-tts.service';

describe('AudioGenerationService', () => {
  let service: AudioGenerationService;
  let azureTTS: jest.Mocked<AzureTTSService>;

  const mockConfigService = {
    get: jest.fn().mockReturnValue(undefined),
  };

  beforeEach(async () => {
    mockConfigService.get.mockClear();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AudioGenerationService,
        {
          provide: AzureTTSService,
          useValue: { synthesize: jest.fn() },
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AudioGenerationService>(AudioGenerationService);
    azureTTS = module.get(AzureTTSService);
  });

  it('returns audio from Plan A when Azure TTS succeeds', async () => {
    azureTTS.synthesize.mockResolvedValueOnce('data:audio/mpeg;base64,abc123');

    const result = await service.generateTextToSpeech('Hello', 'nova');

    expect(result).toBe('data:audio/mpeg;base64,abc123');
    expect(azureTTS.synthesize).toHaveBeenCalledWith('Hello', 'nova');
  });

  it('defaults to "alloy" voice when voiceId is not provided', async () => {
    azureTTS.synthesize.mockResolvedValueOnce('data:audio/mpeg;base64,abc123');

    await service.generateTextToSpeech('Hello');

    expect(azureTTS.synthesize).toHaveBeenCalledWith('Hello', 'alloy');
  });

  it('throws with user-friendly message when both plans fail', async () => {
    azureTTS.synthesize.mockRejectedValueOnce(new Error('Azure TTS down'));
    // Plan B fails: no AZURE_SPEECH_API_KEY in mockConfigService

    await expect(service.generateTextToSpeech('Hello', 'echo')).rejects.toThrow(
      'Servicio de Text-to-Speech no disponible temporalmente.',
    );
  });
});
