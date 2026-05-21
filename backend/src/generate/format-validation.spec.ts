import { GenerateImagesResponseDto, ImageGenerationResult } from './dto/generate-images.dto';
import { GenerateScriptResponseDto } from './dto/generate-script.dto';

describe('Generate response format validation', () => {
    it('should validate script response DTO shape', () => {
        const response: GenerateScriptResponseDto = {
            jobId: 'job-123',
            status: 'pending',
            createdAt: new Date(),
            script: null,
            message: 'Script queued',
        };

        expect(response.jobId).toBe('job-123');
        expect(response.status).toBe('pending');
        expect(response.createdAt).toBeInstanceOf(Date);
    });

    it('should validate image generation result shape', () => {
        const result: ImageGenerationResult = {
            imageUrls: ['https://example.com/image-1.png'],
            prompt: 'A vivid anime scene with neon lights',
            generatedAt: new Date(),
        };

        expect(Array.isArray(result.imageUrls)).toBe(true);
        expect(result.imageUrls[0]).toMatch(/^https?:\/\//);
        expect(result.prompt).toContain('anime');
        expect(result.generatedAt).toBeInstanceOf(Date);
    });
});
