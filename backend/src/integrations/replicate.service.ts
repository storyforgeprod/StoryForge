import { Injectable, Logger } from '@nestjs/common';
import Replicate from 'replicate';

@Injectable()
export class ReplicateService {
  private readonly logger = new Logger(ReplicateService.name);
  private replicate: Replicate;

  constructor() {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      this.logger.warn('⚠️ REPLICATE_API_TOKEN not configured');
    }
    this.replicate = new Replicate({ auth: token });
  }

  async generateImage(
    prompt: string,
    options?: { numImages?: number },
  ): Promise<string[]> {
    try {
      this.logger.log(
        `🎨 Generating image with prompt: ${prompt.substring(0, 50)}...`,
      );

      const output = await this.replicate.run(
        'black-forest-labs/flux-pro',
        {
          input: {
            prompt,
            num_outputs: options?.numImages ?? 1,
            image_size: '1024x1024',
            num_inference_steps: 20,
            guidance_scale: 7.5,
          },
        },
      );

      // Output is array of image URLs
      const imageUrls = Array.isArray(output) ? output : [output];
      this.logger.log(`✅ Generated ${imageUrls.length} image(s)`);
      return imageUrls;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Replicate API error: ${errorMsg}`);
      throw new Error(`Image generation failed: ${errorMsg}`);
    }
  }
}
