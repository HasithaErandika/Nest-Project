import { Injectable, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

@Injectable()
export class HistogramEqualizationService {
  private readonly logger = new Logger(HistogramEqualizationService.name);

  @MessagePattern({ cmd: 'histogram_equalization' })
  async equalizeHistogram(@Payload() data: { imagePath: string }) {
    const { imagePath } = data;

    if (!fs.existsSync(imagePath)) {
      this.logger.error(`Image not found at path: ${imagePath}`);
      throw new Error('Image file not found');
    }

    const outputDir = path.join(process.cwd(), 'apps/enhancement/output_images');
    const outputFileName = `histogram_equalized_${Date.now()}.png`;
    const outputPath = path.join(outputDir, outputFileName);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const metadata = await sharp(imageBuffer).metadata();
      const { width, height } = metadata;

      if (!width || !height) {
        throw new Error('Could not determine image dimensions');
      }

      // Convert to grayscale and get raw pixel data
      const { data: rawBuffer, info } = await sharp(imageBuffer)
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { channels } = info;
      const outputBuffer = Buffer.from(rawBuffer);

      // Calculate histogram
      const histogram = new Array(256).fill(0);
      const totalPixels = width * height;

      for (let i = 0; i < rawBuffer.length; i += channels) {
        const intensity = rawBuffer[i];
        histogram[intensity]++;
      }

      // Calculate CDF (Cumulative Distribution Function)
      const cdf = new Array(256).fill(0);
      cdf[0] = histogram[0];
      for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + histogram[i];
      }

      // Normalize CDF and create mapping
      const cdfMin = Math.min(...cdf.filter(v => v > 0));
      const mapping = new Array(256).fill(0);

      for (let i = 0; i < 256; i++) {
        if (cdf[i] > 0) {
          mapping[i] = Math.round(((cdf[i] - cdfMin) / (totalPixels - cdfMin)) * 255);
        }
      }

      // Apply mapping to image
      for (let i = 0; i < rawBuffer.length; i += channels) {
        const intensity = rawBuffer[i];
        const newIntensity = mapping[intensity];
        for (let c = 0; c < channels; c++) {
          outputBuffer[i + c] = newIntensity;
        }
      }

      this.logger.log('Histogram equalization completed');

      await sharp(outputBuffer, {
        raw: {
          width,
          height,
          channels,
        },
      })
        .png()
        .toFile(outputPath);

      return {
        success: true,
        message: 'Histogram equalization completed successfully',
        savedImagePath: outputPath,
      };
    } catch (error) {
      this.logger.error(`Error in equalizeHistogram: ${error.message}`);
      return {
        success: false,
        message: 'Failed to perform histogram equalization',
        error: error.message,
      };
    }
  }
}
