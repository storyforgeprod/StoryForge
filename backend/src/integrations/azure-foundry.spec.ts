import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AzureOpenAIService } from './azure-openai.service';
import { AzureFoundryImageService } from './azure-foundry-image.service';

const mockConfig = {
    get: jest.fn((key: string) => {
        switch (key) {
            case 'AZURE_OPENAI_ENDPOINT':
            case 'AZURE_FOUNDRY_IMAGE_ENDPOINT':
                return 'https://example.openai.azure.com/';
            case 'AZURE_OPENAI_API_KEY':
            case 'AZURE_FOUNDRY_IMAGE_API_KEY':
                return 'test-key';
            case 'AZURE_OPENAI_DEPLOYMENT_GPT41':
                return 'gpt-4-1-deployment';
            case 'AZURE_FOUNDRY_FLUX_DEPLOYMENT':
                return 'flux-2-pro-deployment';
            case 'AZURE_OPENAI_API_VERSION':
                return '2024-02-15-preview';
            default:
                return undefined;
        }
    }),
};

describe('Azure integration wrappers', () => {
    let openAIService: AzureOpenAIService;
    let foundryImageService: AzureFoundryImageService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AzureOpenAIService,
                AzureFoundryImageService,
                { provide: ConfigService, useValue: mockConfig },
            ],
        }).compile();

        openAIService = module.get<AzureOpenAIService>(AzureOpenAIService);
        foundryImageService = module.get<AzureFoundryImageService>(AzureFoundryImageService);
    });

    it('should generate script text from AzureOpenAIService', async () => {
        (openAIService as any).client = {
            getChatCompletions: jest.fn().mockResolvedValue({
                choices: [
                    {
                        message: {
                            content: 'Scene 1: A hero enters the city.',
                        },
                    },
                ],
            }),
        };

        const result = await openAIService.generateScript('user-1', 'A short test story');
        expect(result).toContain('Scene 1');
    });

    it('should generate image URLs from AzureFoundryImageService', async () => {
        (foundryImageService as any).client = {
            getImages: jest.fn().mockResolvedValue({
                data: [{ url: 'https://example.com/image-1.png' }],
            }),
        };

        const urls = await foundryImageService.generateImages('user-2', 'A shiny robot in a neon city', 1);
        expect(urls).toEqual(['https://example.com/image-1.png']);
    });
});
