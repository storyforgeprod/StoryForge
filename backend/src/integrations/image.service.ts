import { Injectable, Logger } from '@nestjs/common';
import { AzureOpenAIService } from './azure-openai.service';
import { AzureFoundryImageService } from './azure-foundry-image.service';

/**
 * ImageService: Robust image generation with fallback chain
 * 1. Try FLUX (Azure Foundry) - optional, if available
 * 2. Try DALL·E (Azure OpenAI) - primary reliable option
 * 3. Return placeholder - never fails
 */
@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  constructor(
    private readonly azureOpenAIService: AzureOpenAIService,
    private readonly azureFoundryImageService: AzureFoundryImageService,
  ) {}

  async generateImage(userId: string, prompt: string): Promise<string> {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Image prompt cannot be empty');
    }

    // 1. Try FLUX first (optional, if configured)
    try {
      this.logger.log('🔄 Attempting image generation with FLUX');
      const fluxUrl = await this.azureFoundryImageService.generateImages(
        userId,
        prompt,
        1,
      );

      if (fluxUrl && fluxUrl.length > 0) {
        this.logger.log('✅ FLUX succeeded, returning image');
        return fluxUrl[0];
      }
    } catch (fluxError) {
      const fluxMsg = fluxError instanceof Error ? fluxError.message : 'Unknown error';
      this.logger.warn(`⚠️  FLUX failed: ${fluxMsg}. Falling back to DALL·E`);
    }

    // 2. Fallback to DALL·E (stable, reliable)
    try {
      this.logger.log('🔄 Attempting image generation with DALL·E');
      const dalleUrl = await this.azureOpenAIService.generateImage(userId, prompt);
      this.logger.log('✅ DALL·E succeeded, returning image');
      return dalleUrl;
    } catch (dalleError) {
      const dallMsg = dalleError instanceof Error ? dalleError.message : 'Unknown error';
      this.logger.warn(`⚠️  DALL·E failed: ${dallMsg}. Using placeholder`);
    }

    // 3. Final fallback: placeholder (never fails)
    const placeholderUrl = this.getPlaceholder(prompt);
    this.logger.warn('📌 Using placeholder image as final fallback');
    return placeholderUrl;
  }

  private getPlaceholder(prompt: string): string {
    // URL-safe placeholder service
    const encoded = encodeURIComponent(prompt.substring(0, 50));
    return `https://via.placeholder.com/1024x1024.png?text=${encoded}`;
  }
}
